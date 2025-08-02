export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Tasks Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">My Tasks</h2>
        <p className="text-gray-600">Loading tasks...</p>
      </div>

      {/* Employee Goals */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Employee Goals</h2>
        <p className="text-gray-600">Loading goals...</p>
      </div>

      {/* Business Metrics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Business Metrics</h2>
        <p className="text-gray-600">Loading metrics...</p>
      </div>

      {/* Recent 1:1s */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Recent 1:1s</h2>
        <p className="text-gray-600">Loading conversations...</p>
      </div>
    </div>
  );
}