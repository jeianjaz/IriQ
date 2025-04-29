import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';

interface DeviceStatusProps {
  compact?: boolean;
}

interface Device {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  last_seen?: string;
  status?: string;
  online: boolean;
}

export function DeviceStatus({ compact = false }: DeviceStatusProps) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Function to fetch devices
    async function fetchDevices() {
      try {
        setLoading(true);
        setError(null);

        // Get the ESP32 device (either from the devices table or create a virtual entry)
        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .select('*')
          .eq('device_id', 'esp32_device_1')
          .order('created_at', { ascending: false });

        if (deviceError) {
          throw deviceError;
        }
        
        // If no device found, create a virtual entry for the ESP32
        let finalDeviceData = deviceData || [];
        if (finalDeviceData.length === 0) {
          finalDeviceData = [{
            id: 'virtual-esp32',
            device_id: 'esp32_device_1',
            device_name: 'ESP32 Smart Irrigation Controller',
            device_type: 'irrigation_controller',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user?.id || 'system'
          }];
        }

        // Get the latest heartbeat for each device
        const deviceIds = finalDeviceData.map((device) => device.device_id);
        
        let heartbeatData: any[] = [];
        if (deviceIds.length > 0) {
          const { data: heartbeats, error: heartbeatError } = await supabase
            .from('device_heartbeats')
            .select('*')
            .in('device_id', deviceIds)
            .order('last_seen', { ascending: false });

          if (heartbeatError) {
            throw heartbeatError;
          }

          heartbeatData = heartbeats || [];
        }

        // Combine device data with heartbeat data
        const now = new Date();
        const processedDevices = finalDeviceData.map((device) => {
          const latestHeartbeat = heartbeatData.find(
            (hb) => hb.device_id === device.device_id
          );
          
          let online = false;
          if (latestHeartbeat) {
            const lastSeen = new Date(latestHeartbeat.last_seen);
            // Consider device online if heartbeat is within the last 10 minutes
            online = now.getTime() - lastSeen.getTime() < 10 * 60 * 1000;
          }

          return {
            ...device,
            last_seen: latestHeartbeat?.last_seen,
            status: latestHeartbeat?.status,
            online,
          };
        });

        setDevices(processedDevices);
      } catch (err: any) {
        console.error('Error fetching device status:', err);
        setError(err.message || 'Failed to load device status');
      } finally {
        setLoading(false);
      }
    }

    // Fetch devices initially
    fetchDevices();

    // Subscribe to device_heartbeats changes
    const heartbeatSubscription = supabase
      .channel('device_heartbeats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_heartbeats',
        },
        () => {
          // Refetch devices when heartbeats change
          fetchDevices();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(heartbeatSubscription);
    };
  }, [user]);

  // Format time since last seen
  const formatTimeSince = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const lastSeen = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    
    // Less than a minute
    if (diffMs < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diffMs < 60 * 60 * 1000) {
      const minutes = Math.floor(diffMs / (60 * 1000));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / (60 * 60 * 1000));
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // More than a day
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  if (compact) {
    return (
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="p-4 pb-2 border-b">
          <h3 className="text-lg font-semibold">Device Status</h3>
          <p className="text-sm text-gray-500">
            {devices.length} device{devices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-24 text-red-600">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No devices registered
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-100"
                >
                  <div className="flex items-center">
                    {device.online ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                    )}
                    <span className="text-sm font-medium">{device.device_name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    device.online ? "bg-green-500/20 text-green-700" : "bg-amber-500/20 text-amber-700"
                  }`}>
                    {device.online ? "Online" : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="p-4 border-b">
        <h3 className="text-xl font-semibold">Device Status</h3>
        <p className="text-sm text-gray-500">
          Monitor your connected irrigation devices
        </p>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-red-600">
            <AlertTriangle className="mr-2 h-6 w-6" />
            <span>{error}</span>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No devices registered. Add a device to monitor its status.
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-4 rounded-lg border bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      {device.device_name}
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        device.online ? "bg-green-500/20 text-green-700" : "bg-amber-500/20 text-amber-700"
                      }`}>
                        {device.online ? "Online" : "Offline"}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {device.device_id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Type: {device.device_type}
                    </p>
                  </div>
                  <div className="w-16 h-16" title={device.online ? 'Device is online and functioning properly' : 'Device is currently offline'}>
                    {device.online ? (
                      <CircularProgressbar
                        value={100}
                        strokeWidth={12}
                        styles={buildStyles({
                          strokeLinecap: 'round',
                          pathColor: 'rgb(34, 197, 94)',
                          trailColor: 'rgba(34, 197, 94, 0.2)',
                        })}
                        className="drop-shadow-sm"
                      />
                    ) : (
                      <CircularProgressbar
                        value={0}
                        strokeWidth={12}
                        styles={buildStyles({
                          strokeLinecap: 'round',
                          pathColor: 'rgb(245, 158, 11)',
                          trailColor: 'rgba(245, 158, 11, 0.2)',
                        })}
                        className="drop-shadow-sm"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-gray-500">
                    Last seen: {formatTimeSince(device.last_seen)}
                  </span>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  {device.online ? (
                    <Wifi className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 mr-1 text-amber-500" />
                  )}
                  <span className={device.online ? 'text-green-600' : 'text-amber-600'}>
                    {device.online
                      ? 'Connected and sending data'
                      : 'Not currently connected'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
