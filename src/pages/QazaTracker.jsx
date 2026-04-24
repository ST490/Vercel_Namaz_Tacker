import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { PRAYERS, PRAYER_LABELS, PRAYER_ICONS } from '@/lib/prayerUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function QazaTracker() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newPrayer, setNewPrayer] = useState('fajr');
  const [newCount, setNewCount] = useState(1);

  const { data: qazaList = [], isLoading } = useQuery({
    queryKey: ['qaza'],
    queryFn: () => base44.entities.QazaTracker.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.QazaTracker.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['qaza'] }); setShowAdd(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.QazaTracker.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qaza'] }),
  });

  const handleAddQaza = () => {
    const existing = qazaList.find(q => q.prayer_name === newPrayer);
    if (existing) {
      updateMutation.mutate({
        id: existing.id,
        data: { total_missed: existing.total_missed + newCount }
      });
      setShowAdd(false);
    } else {
      createMutation.mutate({ prayer_name: newPrayer, total_missed: newCount, completed_count: 0 });
    }
  };

  const handleComplete = (qaza) => {
    if (qaza.completed_count < qaza.total_missed) {
      updateMutation.mutate({
        id: qaza.id,
        data: { completed_count: qaza.completed_count + 1 }
      });
    }
  };

  const handleUncomplete = (qaza) => {
    if (qaza.completed_count > 0) {
      updateMutation.mutate({
        id: qaza.id,
        data: { completed_count: qaza.completed_count - 1 }
      });
    }
  };

  const totalMissed = qazaList.reduce((sum, q) => sum + (q.total_missed || 0), 0);
  const totalCompleted = qazaList.reduce((sum, q) => sum + (q.completed_count || 0), 0);
  const overallProgress = totalMissed > 0 ? (totalCompleted / totalMissed) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground">Qaza Tracker</h2>
        <p className="text-xs text-muted-foreground mt-1">Make up missed prayers systematically</p>
      </div>

      {/* Overall Progress */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Overall Progress</span>
          </div>
          <span className="text-xs text-muted-foreground">{totalCompleted}/{totalMissed}</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
          {totalMissed - totalCompleted} remaining
        </p>
      </div>

      {/* Prayer breakdown */}
      <div className="space-y-2">
        {qazaList.map((qaza, i) => {
          const progress = qaza.total_missed > 0 ? (qaza.completed_count / qaza.total_missed) * 100 : 0;
          const remaining = qaza.total_missed - qaza.completed_count;
          const isComplete = remaining <= 0;

          return (
            <motion.div
              key={qaza.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-4 ${isComplete ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{PRAYER_ICONS[qaza.prayer_name]}</span>
                  <div>
                    <h4 className="font-semibold text-sm">{PRAYER_LABELS[qaza.prayer_name]}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {isComplete ? 'All caught up! ✨' : `${remaining} remaining`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUncomplete(qaza)}
                    disabled={qaza.completed_count <= 0}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold w-8 text-center">{qaza.completed_count}</span>
                  <button
                    onClick={() => handleComplete(qaza)}
                    disabled={isComplete}
                    className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {qazaList.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No qaza prayers logged yet</p>
          <p className="text-xs mt-1">Tap + to add missed prayers</p>
        </div>
      )}

      {/* Add Button */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            <Plus className="w-4 h-4 mr-2" /> Add Missed Prayers
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Add Missed Prayers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prayer</label>
              <Select value={newPrayer} onValueChange={setNewPrayer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRAYERS.map(p => (
                    <SelectItem key={p} value={p}>
                      {PRAYER_ICONS[p]} {PRAYER_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Number of Missed Prayers</label>
              <Input
                type="number"
                min="1"
                value={newCount}
                onChange={(e) => setNewCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button onClick={handleAddQaza} className="w-full">
              Add to Qaza Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}