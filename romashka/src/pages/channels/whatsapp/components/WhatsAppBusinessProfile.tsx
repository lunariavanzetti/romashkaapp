import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building, User, Mail, Globe, MapPin } from 'lucide-react';

interface WhatsAppBusinessProfileProps {
  channelId: string;
}

const WhatsAppBusinessProfile: React.FC<WhatsAppBusinessProfileProps> = ({ channelId }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
        <p className="text-gray-600">Manage your WhatsApp business profile information</p>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="business-name">Business Name</Label>
              <Input id="business-name" placeholder="Enter business name" />
            </div>
            <div>
              <Label htmlFor="business-email">Business Email</Label>
              <Input id="business-email" type="email" placeholder="Enter business email" />
            </div>
          </div>
          <div>
            <Label htmlFor="business-description">Business Description</Label>
            <Textarea id="business-description" placeholder="Describe your business" rows={3} />
          </div>
          <div>
            <Label htmlFor="business-address">Business Address</Label>
            <Textarea id="business-address" placeholder="Enter business address" rows={2} />
          </div>
          <div>
            <Label htmlFor="business-website">Website</Label>
            <Input id="business-website" placeholder="https://your-website.com" />
          </div>
          <Button>Update Profile</Button>
        </CardContent>
      </Card>

      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Picture</h3>
            <p className="text-gray-600 mb-4">
              Upload and manage your business profile picture.
            </p>
            <Button>Upload Picture</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppBusinessProfile;