"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Visitor {
  ip_address: string;
  path: string;
  timestamp: string;
  user__username: string | null;
  method: string;
}

interface RecentVisitorsProps {
  data: Visitor[] | undefined;
}

export default function RecentVisitors({ data }: RecentVisitorsProps) {
  const [locations, setLocations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;

    data.forEach(async (visitor) => {
        if (!locations[visitor.ip_address] && visitor.ip_address !== '127.0.0.1') {
             try {
                 const res = await fetch(`https://ipapi.co/${visitor.ip_address}/json/`);
                 const geo = await res.json();
                 if (geo.city && geo.country_name) {
                     setLocations(prev => ({...prev, [visitor.ip_address]: `${geo.city}, ${geo.country_name}`}));
                 }
             } catch (e) {
                 // Silent fail
                 console.log("Geo fetch failed", e);
             }
        }
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Recent Visitors (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/60 text-sm">No visitors recorded today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Recent Visitors (Today)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-white/60">Time</TableHead>
                <TableHead className="text-white/60">IP Address</TableHead>
                <TableHead className="text-white/60">Location</TableHead>
                <TableHead className="text-white/60">Last Path</TableHead>
                <TableHead className="text-white/60">User</TableHead>
                <TableHead className="text-white/60">Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((visitor, index) => (
                <TableRow key={index} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white font-mono text-xs">
                    {new Date(visitor.timestamp).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-white font-mono text-xs">
                    {visitor.ip_address}
                  </TableCell>
                  <TableCell className="text-white/80 text-sm">
                    {visitor.ip_address === '127.0.0.1' ? 'Localhost' : (locations[visitor.ip_address] || '...')}
                  </TableCell>
                  <TableCell className="text-white/80 text-sm truncate max-w-[200px]" title={visitor.path}>
                    {visitor.path}
                  </TableCell>
                  <TableCell className="text-white/80 text-sm">
                    {visitor.user__username ? (
                        <span className="text-emerald-400 font-medium">{visitor.user__username}</span>
                    ) : (
                        <span className="text-white/40 italic">Guest</span>
                    )}
                  </TableCell>
                   <TableCell className="text-white/80 text-sm">
                    <Badge variant="outline" className={`
                        ${visitor.method === 'GET' ? 'border-blue-500/50 text-blue-400' : ''}
                        ${visitor.method === 'POST' ? 'border-green-500/50 text-green-400' : ''}
                        ${['PUT', 'PATCH'].includes(visitor.method) ? 'border-amber-500/50 text-amber-400' : ''}
                        ${visitor.method === 'DELETE' ? 'border-red-500/50 text-red-400' : ''}
                    `}>
                        {visitor.method}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
