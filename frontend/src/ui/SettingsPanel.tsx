export function SettingsPanel() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block mb-1" htmlFor="theme">
          Theme
        </label>
        <select id="theme" className="border px-3 py-2 rounded">
          <option value="system">System</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
      <div>
        <label className="block  mb-1" htmlFor="notifications">
          Notifications
        </label>
        <input type="checkbox" id="notifications" className="mr-2" />
        Enable notifications
      </div>
    </div>
  );
}
