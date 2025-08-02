'use client';

import { Metric } from '@prisma/client';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface MetricsDashboardProps {
  metrics: Metric[];
  onCreateMetric?: () => void;
}

export function MetricsDashboard({ metrics, onCreateMetric }: MetricsDashboardProps) {
  function getProgressColor(current: number, target: number) {
    const progress = (current / target) * 100;
    if (progress >= 100) return 'bg-green-600';
    if (progress >= 75) return 'bg-blue-600';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-600';
  }

  function formatNumber(value: number) {
    return new Intl.NumberFormat().format(value);
  }

  function calculateProgress(current: number, target: number) {
    return Math.min(Math.round((current / target) * 100), 100);
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Metrics Dashboard</h2>
        {onCreateMetric && (
          <button
            onClick={onCreateMetric}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Metric
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const progress = calculateProgress(metric.current, metric.target);
            const progressColor = getProgressColor(metric.current, metric.target);
            const isIncreasing = metric.current > metric.target * 0.8;

            return (
              <div
                key={metric.id}
                className="bg-white overflow-hidden shadow rounded-lg border"
              >
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {isIncreasing ? (
                        <ArrowUpIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="ml-3 w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {metric.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-500">
                          {formatNumber(metric.current)} / {formatNumber(metric.target)} {metric.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-gray-600">
                            Progress
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-gray-600">
                            {progress}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div
                          style={{ width: `${progress}%` }}
                          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor} transition-all duration-500`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {metrics.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-6">
            No metrics available. Add some metrics to start tracking progress.
          </div>
        )}
      </div>
    </div>
  );
}