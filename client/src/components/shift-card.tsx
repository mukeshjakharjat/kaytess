import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, DollarSign, Building2 } from "lucide-react";
import NursingHomeProfileViewer from "@/components/nursing-home-profile-viewer";
import type { ShiftWithDetails } from "@shared/schema";

interface ShiftCardProps {
  shift: ShiftWithDetails;
  onApply: (shiftId: number, notes?: string) => void;
  isApplying: boolean;
}

export default function ShiftCard({ shift, onApply, isApplying }: ShiftCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [applicationNotes, setApplicationNotes] = useState("");

  const handleApply = () => {
    onApply(shift.id, applicationNotes);
    setIsDialogOpen(false);
    setApplicationNotes("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{shift.creator?.facilityName || shift.facility?.name}</h3>
            <p className="text-sm text-slate-600">{shift.department?.name}</p>
          </div>
          <Badge className={getPriorityColor(shift.priority || 'regular')}>
            {(shift.priority || 'regular').toUpperCase()}
          </Badge>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-slate-600">
            <Calendar className="text-medical-blue mr-2 h-4 w-4" />
            <span>{formatDate(shift.shiftDate)}</span>
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <Clock className="text-medical-blue mr-2 h-4 w-4" />
            <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <MapPin className="text-medical-blue mr-2 h-4 w-4" />
            <span>{shift.creator?.city || shift.facility?.city}, {shift.creator?.state || shift.facility?.state}</span>
          </div>
          <div className="flex items-center text-sm font-semibold text-healthcare-green">
            <DollarSign className="text-healthcare-green mr-2 h-4 w-4" />
            <span>${shift.hourlyRate}/hour</span>
          </div>
        </div>

        {shift.requirements && (
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Requirements:</span> {shift.requirements}
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          {/* View Nursing Home Profile Button */}
          <NursingHomeProfileViewer 
            nursingHomeId={shift.createdBy}
            trigger={
              <Button variant="outline" size="sm" className="w-full flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>View Facility Profile</span>
              </Button>
            }
          />
          
          {/* Apply for Shift Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-medical-blue hover:bg-blue-700"
                disabled={isApplying || shift.status !== 'open'}
              >
                {shift.status !== 'open' ? 'No Longer Available' : 'Apply for Shift'}
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Shift</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-900">{shift.creator?.facilityName || shift.facility?.name}</h4>
                <p className="text-sm text-slate-600">{shift.department?.name}</p>
                <p className="text-sm text-slate-600">
                  {formatDate(shift.shiftDate)} • {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                </p>
                <p className="text-sm font-medium text-healthcare-green">${shift.hourlyRate}/hour</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Application Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Tell us why you're interested in this shift or any relevant experience..."
                  value={applicationNotes}
                  onChange={(e) => setApplicationNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="flex-1 bg-medical-blue hover:bg-blue-700"
                >
                  {isApplying ? "Submitting..." : "Submit Application"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
