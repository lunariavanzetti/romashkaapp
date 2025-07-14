import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Shield, Clock, Phone } from 'lucide-react';

interface WhatsAppSettingsProps {
  channelId: string;
}

const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({ channelId }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">WhatsApp Settings</h2>
        <p className="text-gray-600">Configure your WhatsApp channel settings</p>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone-number-id">Phone Number ID</Label>
              <Input id="phone-number-id" placeholder="Enter phone number ID" />
            </div>
            <div>
              <Label htmlFor="access-token">Access Token</Label>
              <Input id="access-token" type="password" placeholder="Enter access token" />
            </div>
          </div>
          <div>
            <Label htmlFor="webhook-secret">Webhook Secret</Label>
            <Input id="webhook-secret" type="password" placeholder="Enter webhook secret" />
          </div>
          <Button>Save Configuration</Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Settings</h3>
            <p className="text-gray-600">
              Security configuration options will be available here.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Hours Configuration</h3>
            <p className="text-gray-600">
              Configure your business hours for automated responses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppSettings;