import { useState } from 'react';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatAdminDateTime } from '@/lib/utils/adminDate';

interface FundingRequest {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  amount: number;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  adminNotes?: string;
}

interface PendingRequestsProps {
  requests: FundingRequest[];
  onApprove: (requestId: string, notes?: string) => void;
  onReject: (requestId: string, notes?: string) => void;
}

export default function PendingRequests({ requests, onApprove, onReject }: PendingRequestsProps) {
  const [selectedRequest, setSelectedRequest] = useState<FundingRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');

  const handleAction = (request: FundingRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setShowDialog(true);
  };

  const confirmAction = () => {
    if (!selectedRequest) return;

    if (actionType === 'approve') {
      onApprove(selectedRequest.id, notes);
    } else {
      onReject(selectedRequest.id, notes);
    }

    setShowDialog(false);
    setNotes('');
    setSelectedRequest(null);
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mt-8 backdrop-blur-md">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Pending Funding Requests</h2>
              <p className="text-xs text-white/40">Review and approve user funding requests</p>
            </div>
            <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
              <Clock className="w-3 h-3 mr-1" />
              {requests.length} Pending
            </Badge>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{request.user.username}</p>
                  <p className="text-xs text-white/40">{request.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-green-500">
                    +${request.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-white/40">
                    {formatAdminDateTime(request.requestedAt)} UTC
                  </p>
                </div>

                {request.proofUrl && (
                  <PremiumButton
                    variant="outline"
                    onClick={() => window.open(request.proofUrl, '_blank')}
                    text="Proof"
                    icon={FileText}
                    className="border-white/10"
                  />
                )}

                <div className="flex items-center gap-2">
                  <PremiumButton
                    onClick={() => handleAction(request, 'approve')}
                    text="Approve"
                    icon={CheckCircle}
                  />
                  <PremiumButton
                    onClick={() => handleAction(request, 'reject')}
                    variant="outline"
                    text="Reject"
                    icon={XCircle}
                    className="border-red-500/30 text-red-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="p-8">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Funding Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRequest && (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-white/40 mb-1">User</p>
                <p className="font-semibold text-white mb-3">{selectedRequest.user.username}</p>
                <p className="text-sm text-white/40 mb-1">Amount</p>
                <p className="font-bold text-green-400">
                  ${selectedRequest.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm text-white/40 mb-2 block">Admin Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="rounded-full px-6 h-11 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              Cancel
            </Button>
            <PremiumButton
              onClick={confirmAction}
              text={actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
              icon={actionType === 'approve' ? CheckCircle : XCircle}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
