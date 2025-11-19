import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dbService } from '../services/db';
import { ClassLevel } from '../types';

export const Analytics: React.FC = () => {
  const [divData, setDivData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calcStats = async () => {
      const marks = await dbService.getMarks();
      // Simple aggregation for demo: Count divisions across school
      const counts = { I: 0, II: 0, III: 0, U: 0, '-': 0 };
      
      marks.forEach(m => {
        if (m.division in counts) {
            counts[m.division as keyof typeof counts]++;
        }
      });

      setDivData([
        { name: 'Div I', value: counts.I },
        { name: 'Div II', value: counts.II },
        { name: 'Div III', value: counts.III },
        { name: 'Ungraded', value: counts.U },
      ]);
      setLoading(false);
    };
    calcStats();
  }, []);

  const COLORS = ['#28a745', '#007bff', '#ffc107', '#dc3545'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow h-80">
            <h3 className="text-lg font-medium mb-4">Division Distribution (School Wide)</h3>
            {loading ? <p>Loading...</p> : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={divData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#0033cc" name="Students" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow h-80">
             <h3 className="text-lg font-medium mb-4">Pass Rates</h3>
             {loading ? <p>Loading...</p> : (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={divData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {divData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
             )}
        </div>
      </div>
    </div>
  );
};
