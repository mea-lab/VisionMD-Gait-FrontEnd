import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CloudDownload, ArrowDropDown } from '@mui/icons-material';

const FeatureTable = ({ tasks, selectedTaskIndex, fileName }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const task = tasks[selectedTaskIndex] || {};
  const entries = Object.entries(task.data || {}).filter(([, v]) => typeof v === 'number' || typeof v === 'string');
  const header = useMemo(() => entries.map(([k]) => k), [entries]);

  const btn = `bg-[#1976d2] hover:bg-[#1565c0] text-white font-medium px-3 py-1 rounded-md inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed`;

  const hasData = !!task.data;
  const hasGroup = tasks.some(t => t.name === task.name && t.data);
  
  const safe = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const csvRow = arr => {
    return (
      arr.map(v =>
        v == null ? '' : typeof v === 'string' && v.includes(',') ? `"${v}"` : v
      ).join(',')
    )
  };

  const blob = (txt, name) => {
    const url = URL.createObjectURL(
      new Blob([txt], { type: 'text/csv;charset=utf-8;' })
    );
    Object.assign(document.createElement('a'), { href: url, download: name }).click();
    URL.revokeObjectURL(url);
  };

  const csvCurrent = () => {
    if (!task.data) return;
    blob(
      [csvRow(header), csvRow(header.map(h => task.data[h]))].join('\n'),
      `${safe(fileName)}_${safe(task.name)}.csv`
    );
  };

  const csvAll = () => {
    const group = tasks.filter(t => t.name === task.name && t.data);
    if (!group.length) return;
    const rows = group.map(t => csvRow(header.map(h => t.data[h] ?? '')));
    const avg = header.map(h => {
      const lower = h.toLowerCase();
      if (lower === 'task name') return `average_${fileName.split('.')[0]}`;
      if (lower === 'file name') return fileName;
      const nums = group.map(t => t.data[h]).filter(v => typeof v === 'number');
      return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(4) : '';
    });
    rows.push(csvRow(avg));
    blob(
      [csvRow(header), ...rows].join('\n'),
      `${safe(fileName)}_${safe(task.name)}_all.csv`
    );
  };

  useEffect(() => {
    const h = e => !ref.current?.contains(e.target) && setOpen(false);
    open && document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <>
      <div className="overflow-x-auto m-4 rounded-lg shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map(([k, v]) => (
              <tr key={k}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{k}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {typeof v === 'number' ? v.toFixed(4) : v}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div ref={ref} className="relative flex justify-center mt-4 mb-12">
        <div className="flex">
          <button
            className={`${btn} rounded-r-none border-r border-blue-800`}
            onClick={csvCurrent}
            disabled={!hasData}
          >
            <CloudDownload fontSize="small" /> Download CSV
          </button>
          <button
            className={`${btn} rounded-l-none px-2`}
            onClick={() => setOpen(o => !o)}
            disabled={!hasGroup}
          >
            <ArrowDropDown fontSize="small" />
          </button>
        </div>

        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-md z-20">
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => {
                csvAll();
                setOpen(false);
              }}
              disabled={!hasGroup}
            >
              Download All
            </button>
          </div>
        )}
      </div>

    </>
  );
};

export default FeatureTable;
