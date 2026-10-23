import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit2, Trash2, Save, X, Layout, GripVertical, ChevronRight, ChevronDown, Monitor } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchSidebarMenu } from '@/store/slices/sidebarSlice';

// DND Kit Imports
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

interface SystemMenuItem {
  menu_id: number;
  menu_name: string;
  menu_group: string;
  group_order: number;
  menu_icon: string;
  menu_path: string;
  roles_allowed: string | any[];
  department_scope: string | any[];
  users_allowed: string | any[];
  is_active: number | boolean;
  menu_order_priority: number;
}

interface GroupedData {
  [key: string]: SystemMenuItem[];
}

// --- Sortable Item Component ---
const SortableItem = ({ item, onEdit }: { item: SystemMenuItem, onEdit: (item: SystemMenuItem) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `item-${item.menu_id}`,
    data: { type: 'item', item }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors shadow-sm mb-2",
        isDragging && "shadow-lg border-primary ring-2 ring-primary/10"
      )}
    >
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground/50 hover:text-primary transition-colors">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate flex items-center gap-2">
            {item.menu_name}
            {!item.is_active && <Badge variant="secondary" className="text-[9px] uppercase h-4 px-1">Inactive</Badge>}
        </div>
        <div className="text-[10px] text-muted-foreground font-mono truncate">{item.menu_path}</div>
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onEdit(item)}>
        <Edit2 className="w-3 h-3" />
      </Button>
    </div>
  );
};

// --- Sortable Section Component ---
const SortableSection = ({ groupName, items, onEdit }: { groupName: string, items: SystemMenuItem[], onEdit: (item: SystemMenuItem) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `group-${groupName}`,
    data: { type: 'group', groupName }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("mb-10", isDragging && "opacity-50")}>
      <div className="flex items-center gap-4 mb-4 group/header">
        <div {...listeners} {...attributes} className="cursor-grab p-1 hover:bg-muted rounded text-muted-foreground/30 hover:text-primary transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="h-[1px] flex-1 bg-border/50" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary/70 px-4 py-1 bg-primary/5 rounded-full border border-primary/10">
          {groupName}
        </h3>
        <div className="h-[1px] flex-1 bg-border/50" />
      </div>

      <SortableContext items={items.map(i => `item-${i.menu_id}`)} strategy={verticalListSortingStrategy}>
        <div className="pl-8 min-h-[50px] transition-all">
          {items.length === 0 && <div className="p-4 border border-dashed rounded-lg text-xs text-center text-muted-foreground">Drop items here</div>}
          {items.map(item => (
            <SortableItem key={item.menu_id} item={item} onEdit={onEdit} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const SidebarMenuSettings = () => {
  const { toast } = useToast();
  const [menus, setMenus] = useState<SystemMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeItem, setActiveItem] = useState<SystemMenuItem | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Partial<SystemMenuItem> | null>(null);
  const dispatch = useAppDispatch();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/hots_system_menu/admin`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` }
      });
      if (response.data.success) {
        const flat: SystemMenuItem[] = [];
        Object.values(response.data.data).forEach((g: any) => flat.push(...g));
        setMenus(flat);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load menus", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenus(); }, []);

  const groups = useMemo(() => {
    const map: GroupedData = {};
    const sortedMenus = [...menus].sort((a, b) => {
        if (a.group_order !== b.group_order) return a.group_order - b.group_order;
        return a.menu_order_priority - b.menu_order_priority;
    });
    sortedMenus.forEach(m => {
      if (!map[m.menu_group]) map[m.menu_group] = [];
      map[m.menu_group].push(m);
    });
    return map;
  }, [menus]);

  const groupNames = useMemo(() => Object.keys(groups), [groups]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === 'item') setActiveItem(active.data.current?.item);
    if (type === 'group') setActiveGroup(active.data.current?.groupName);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'item') {
        const activeId = active.id.toString().replace('item-', '');
        const overId = over.id.toString();

        // Dragging over a group header
        if (overType === 'group') {
            const targetGroup = over.data.current?.groupName;
            setMenus(prev => {
                const updated = [...prev];
                const item = updated.find(i => i.menu_id === parseInt(activeId));
                if (item && item.menu_group !== targetGroup) {
                    item.menu_group = targetGroup;
                    // Also update group_order to match target group's first item
                    const targetFirstItem = updated.find(i => i.menu_group === targetGroup);
                    if (targetFirstItem) item.group_order = targetFirstItem.group_order;
                }
                return updated;
            });
        }
        
        // Dragging over another item
        if (overType === 'item') {
            const targetItem = over.data.current?.item;
            setMenus(prev => {
                const updated = [...prev];
                const item = updated.find(i => i.menu_id === parseInt(activeId));
                if (item && targetItem && item.menu_group !== targetItem.menu_group) {
                    item.menu_group = targetItem.menu_group;
                    item.group_order = targetItem.group_order;
                }
                return updated;
            });
        }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    setActiveGroup(null);

    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === 'item' && active.id !== over.id) {
        setMenus(prev => {
            const activeId = parseInt(active.id.toString().replace('item-', ''));
            const overId = over.id.toString().includes('item-') 
                ? parseInt(over.id.toString().replace('item-', ''))
                : null;

            const oldIndex = prev.findIndex(i => i.menu_id === activeId);
            const newIndex = overId !== null 
                ? prev.findIndex(i => i.menu_id === overId)
                : oldIndex;

            const moved = arrayMove(prev, oldIndex, newIndex);
            
            // Normalize internal priorities within each group
            const final = [...moved];
            const groupCounters: {[key: string]: number} = {};
            final.forEach((item, idx) => {
                if (!groupCounters[item.menu_group]) groupCounters[item.menu_group] = 0;
                item.menu_order_priority = groupCounters[item.menu_group] * 10;
                groupCounters[item.menu_group]++;
            });
            return final;
        });
    }

    if (activeType === 'group' && active.id !== over.id) {
        // Rearranging Sections
        setMenus(prev => {
            const activeG = active.data.current?.groupName;
            const overG = over.data.current?.groupName || over.data.current?.item?.menu_group;
            
            if (!activeG || !overG || activeG === overG) return prev;

            const distinctGroups = Object.keys(groups);
            const oldIdx = distinctGroups.indexOf(activeG);
            const newIdx = distinctGroups.indexOf(overG);
            
            const reorderedGroups = arrayMove(distinctGroups, oldIdx, newIdx);
            
            const updated = [...prev];
            updated.forEach(item => {
                const gIdx = reorderedGroups.indexOf(item.menu_group);
                item.group_order = (gIdx + 1) * 10;
            });
            return updated;
        });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.post(`${API_URL}/hots_system_menu/bulk-update`, { items: menus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` }
      });
      if (response.data.success) {
        toast({ title: "Structure Saved", description: "Menu order updated successfully." });
        fetchMenus();
        dispatch(fetchSidebarMenu()); // Sync live sidebar
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to save menu structure", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEditItem = (item: SystemMenuItem) => {
      setEditingMenu({
          ...item,
          roles_allowed: typeof item.roles_allowed === 'string' ? JSON.parse(item.roles_allowed) : item.roles_allowed,
          department_scope: typeof item.department_scope === 'string' ? JSON.parse(item.department_scope) : item.department_scope,
          users_allowed: typeof item.users_allowed === 'string' ? JSON.parse(item.users_allowed) : item.users_allowed,
      });
      setIsDialogOpen(true);
  };

  const handleAddItem = () => {
      setEditingMenu({
          menu_name: '',
          menu_group: groupNames[0] || 'New Group',
          group_order: (groupNames.length + 1) * 10,
          menu_icon: 'Layout',
          menu_path: '/',
          roles_allowed: ['all'],
          department_scope: ['all'],
          users_allowed: [],
          is_active: 1,
          menu_order_priority: 999
      });
      setIsDialogOpen(true);
  };

  const handleSaveDialog = async () => {
      setSaving(true);
      try {
          const isUpdate = !!editingMenu?.menu_id;
          const url = `${API_URL}/hots_system_menu/${isUpdate ? 'update' : 'add'}`;
          await axios.post(url, editingMenu, {
              headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` }
          });
          toast({ title: "Success", description: "Item saved." });
          setIsDialogOpen(false);
          fetchMenus();
      } catch (err) {
          toast({ title: "Error", description: "Failed to save item", variant: "destructive" });
      } finally {
          setSaving(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Monitor className="w-8 h-8 text-primary" />
            SIDEBAR <span className="text-primary/50 text-xl font-light">BUILDER</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure layout, grouping and access control visually.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
            <Button onClick={handleSave} disabled={saving} className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Structure
            </Button>
        </div>
      </div>

      <Card className="border shadow-xl bg-background/50 backdrop-blur-sm overflow-visible">
        <CardContent className="pt-8 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-sm font-medium animate-pulse">Loading menu configuration...</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={groupNames.map(g => `group-${g}`)} strategy={verticalListSortingStrategy}>
                <AnimatePresence>
                  {groupNames.map(groupName => (
                    <SortableSection 
                      key={groupName} 
                      groupName={groupName} 
                      items={groups[groupName]} 
                      onEdit={handleEditItem} 
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>

              <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: { active: { opacity: '0.5' } }
                })
              }}>
                {activeItem ? (
                  <div className="flex items-center gap-3 p-3 bg-white border-2 border-primary rounded-lg shadow-2xl scale-105 opacity-90">
                    <GripVertical className="w-4 h-4 text-primary" />
                    <div className="font-semibold text-sm">{activeItem.menu_name}</div>
                  </div>
                ) : activeGroup ? (
                   <div className="px-6 py-2 bg-primary text-white font-bold rounded-full shadow-2xl scale-110 opacity-90 border-2 border-white">
                      {activeGroup}
                   </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingMenu?.menu_id ? 'Edit Menu Item' : 'New Menu Item'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                       <Label>Name</Label>
                       <Input value={editingMenu?.menu_name || ''} onChange={e => setEditingMenu(p => ({...p!, menu_name: e.target.value}))} />
                   </div>
                   <div className="space-y-2">
                       <Label>Icon</Label>
                       <Input value={editingMenu?.menu_icon || ''} onChange={e => setEditingMenu(p => ({...p!, menu_icon: e.target.value}))} />
                   </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                       <Label>Group Name</Label>
                       <Input value={editingMenu?.menu_group || ''} onChange={e => setEditingMenu(p => ({...p!, menu_group: e.target.value}))} />
                   </div>
                   <div className="space-y-2">
                       <Label>Internal Group Order</Label>
                       <Input type="number" value={editingMenu?.group_order || 0} onChange={e => setEditingMenu(p => ({...p!, group_order: parseInt(e.target.value)}))} />
                   </div>
               </div>
               <div className="space-y-2">
                   <Label>Path / URL</Label>
                   <Input value={editingMenu?.menu_path || ''} onChange={e => setEditingMenu(p => ({...p!, menu_path: e.target.value}))} />
               </div>
               <div className="space-y-2">
                    <Label>Permissions (Roles JSON)</Label>
                    <Input value={JSON.stringify(editingMenu?.roles_allowed)} onChange={e => { try { setEditingMenu(p=>({...p!, roles_allowed: JSON.parse(e.target.value)})); } catch {} }} />
               </div>
               <div className="flex items-center gap-2">
                   <Switch checked={!!editingMenu?.is_active} onCheckedChange={v => setEditingMenu(p => ({...p!, is_active: v ? 1 : 0}))} />
                   <Label>Available to users</Label>
               </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDialog}>Update Metadata</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SidebarMenuSettings;
