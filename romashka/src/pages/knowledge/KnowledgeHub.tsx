import React, { useState } from 'react';
import { Box, Typography, Paper, InputBase, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Tooltip } from '@mui/material';
import { Search, CloudUpload, CloudDownload, Add, BarChart } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { KnowledgeItem, KnowledgeCategory } from '../../types/knowledge';

const mockCategories: KnowledgeCategory[] = [
  { id: 'cat1', name: 'General', order: 0 },
  { id: 'cat2', name: 'Billing', order: 1 },
  { id: 'cat3', name: 'Technical', order: 2 },
];

const mockItems: KnowledgeItem[] = [
  { id: '1', title: 'How to reset password?', content: '...', category: 'General', tags: ['account'], source_type: 'manual', confidence_score: 0.98, usage_count: 12, last_updated: new Date() },
  { id: '2', title: 'Refund policy', content: '...', category: 'Billing', tags: ['refund'], source_type: 'url', confidence_score: 0.92, usage_count: 8, last_updated: new Date() },
];

export default function KnowledgeHub() {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState(mockCategories);
  const [items] = useState(mockItems);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(categories);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setCategories(reordered.map((cat, i) => ({ ...cat, order: i })));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>Knowledge Base</Typography>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
        <InputBase placeholder="Search knowledge..." value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1, ml: 1 }} />
        <IconButton><Search /></IconButton>
        <Tooltip title="Import"><IconButton><CloudUpload /></IconButton></Tooltip>
        <Tooltip title="Export"><IconButton><CloudDownload /></IconButton></Tooltip>
        <Tooltip title="Analytics"><IconButton><BarChart /></IconButton></Tooltip>
        <Button variant="contained" color="primary" startIcon={<Add />}>Add Content</Button>
      </Paper>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="categories" direction="horizontal">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(provided: any) => (
              <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', gap: 12 }}>
                {categories.map((cat, idx) => (
                  <Draggable key={cat.id} draggableId={cat.id} index={idx}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(prov: any) => (
                      <Paper ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} sx={{ p: 2, minWidth: 120, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText', fontWeight: 600, cursor: 'grab' }}>{cat.name}</Paper>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.filter(i => i.title.toLowerCase().includes(search.toLowerCase())).map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.tags.map(t => <Chip key={t} label={t} size="small" sx={{ mr: 0.5 }} />)}</TableCell>
                <TableCell>{item.source_type}</TableCell>
                <TableCell>{(item.confidence_score * 100).toFixed(1)}%</TableCell>
                <TableCell>{item.usage_count}</TableCell>
                <TableCell>{item.last_updated.toLocaleString()}</TableCell>
                <TableCell><Button size="small">Edit</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 