import React, { useState } from 'react';
import { useTableEngine } from '../../../1.Frontend/packages/table-engine/src/state/useTableEngine';

const rows = [{id:1, team:'A'}, {id:2, team:'A'}, {id:3, team:'B'}];
const columns = [{key:'id', label:'ID'}, {key:'team', label:'Team'}];

/** Isolated synthetic harness: no adapter, backend, auth or database. */
export function SelectionGroupingPreview() {
  const [selected, setSelected] = useState<React.Key[]>([99]);
  const [controlled, setControlled] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const state = useTableEngine({title:'Dummy state', reportKey:'dummy-refactor', rows,
    columns, visibleColumns:{}, savedViewsAdapter:null, selectedRowKeys:selected,
    onSelectionChange:setSelected, groupBy:controlled?group:undefined,
    onGroupByChange:controlled?setGroup:undefined});
  return <section data-testid="table-refactor">
    <button onClick={state.handleToggleSelectAll}>Select page</button>
    <button onClick={()=>state.handleToggleRowSelect(1,rows[0])}>Toggle first</button>
    <button onClick={()=>state.handleGroupByChange('team')}>Group team</button>
    <button onClick={()=>state.toggleGroupCollapse('A')}>Collapse A</button>
    <button onClick={()=>setControlled(true)}>Controlled group</button>
    {state.columnOrder.map(key=><button key={key} draggable
      data-testid={`drag-${key}`} onDragStart={e=>state.handleDragStart(e,key)}
      onDragOver={e=>state.handleDragOver(e,key)} onDrop={e=>state.handleDrop(e,key)}
      onDragEnd={state.handleDragEnd}>{key}</button>)}
    <pre data-testid="table-refactor-state">{JSON.stringify({selected,
      all:state.isAllSelected, some:state.isSomeSelected, group:state.activeGroupBy,
      groups:state.groupedEntries, collapsed:[...state.collapsedGroups],
      order:state.columnOrder, dragging:state.draggedColKey})}</pre>
  </section>;
}
