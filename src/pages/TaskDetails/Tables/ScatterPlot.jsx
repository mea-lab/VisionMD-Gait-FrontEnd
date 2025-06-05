import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { CloudDownload } from '@mui/icons-material';
import Button from '@mui/material/Button';

const ScatterPlot = ({ tasks, selectedTaskIndex, fileName }) => {
  const currentTask = tasks[selectedTaskIndex];
  const { radarTable } = currentTask.data;
  const currentTaskName = currentTask.name;

  const [plotlyData, setPlotlyData] = useState([]);
  const [plotlyLayout, setPlotlyLayout] = useState({});
  const [plotlyConfig, setPlotlyConfig] = useState({});
  const [tableView, setTableView] = useState(true);

  useEffect(() => {
    const features = Object.keys(radarTable);
    const values = Object.values(radarTable);

    setPlotlyData([
      {
        type: 'scatterpolar',
        r: values,
        theta: features,
        fill: 'toself',
        name: currentTaskName,
      },
    ]);

    setPlotlyLayout({
      polar: {
        radialaxis: { visible: true, autorange: true, },
      },
      showlegend: false,
      autosize: false,
      height: 600,
      width: 600,
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
      font: { size: 7 },
      automargin: true,
    });

    setPlotlyConfig({
      modeBarButtonsToRemove: ['zoom2d', 'select2d', 'lasso2d', 'resetScale2d'],
      responsive: true,
      displaylogo: false,
      toImageButtonOptions: {
        filename: (fileName ? fileName.replace(/\.[^/.]+$/, '') : currentTaskName) + '_radarPlot',
      },
    });
  }, [radarTable, currentTaskName, fileName]);

  const showTable = () => setTableView(true);
  const showPlot = () => setTableView(false);

  const downloadCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,Feature,Value\r\n';
    Object.entries(radarTable).forEach(([feat, val]) => {
      csv += `${feat},${typeof val === 'number' ? val.toFixed(6) : val}\r\n`;
    });
    const encoded = encodeURI(csv);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `${(fileName ? fileName.replace(/\.[^/.]+$/, '') : currentTaskName)}_${currentTaskName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="flex p-4 space-x-2">
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-md ${tableView ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={showTable}
        >
          Table
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-md ${!tableView ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={showPlot}
        >
          Scatter Plot
        </button>
      </div>

      {tableView ? (
        <div className="p-6">
          <div className="overflow-x-auto rounded-lg shadow-lg">
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
                {Object.entries(radarTable).map(([feat, val]) => (
                  <tr key={feat}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {feat}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof val === 'number' ? val.toFixed(4) : val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <Button
              variant="contained"
              onClick={downloadCSV}
              startIcon={<CloudDownload />}
              sx={{
                textTransform: 'none',
                fontWeight: 'bold',
                px: 3,
                py: 1,
              }}
            >
              Download CSV
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
        <Plot data={plotlyData} layout={plotlyLayout} config={plotlyConfig} />
        </div>
      )}
    </div>
  );
};

export default ScatterPlot;
