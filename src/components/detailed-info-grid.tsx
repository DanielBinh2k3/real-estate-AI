'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MapPin,
  ShoppingCart,
  ScrollText,
  ShieldCheck,
  Construction,
  FileText,
} from 'lucide-react';
import type { SummaryDetails, SummaryResult } from '@/lib/types';

type DetailedInfoGridProps = {
  summary: SummaryResult;
  details: SummaryDetails;
};

const criteriaConfig = [
  {
    key: 'location',
    title: 'Vị trí',
    icon: MapPin,
  },
  {
    key: 'utilities',
    title: 'Tiện ích',
    icon: ShoppingCart,
  },
  {
    key: 'planning',
    title: 'Quy hoạch',
    icon: ScrollText,
  },
  {
    key: 'legal',
    title: 'Pháp lý',
    icon: ShieldCheck,
  },
  {
    key: 'quality',
    title: 'Chất lượng',
    icon: Construction,
  },
] as const;

export function DetailedInfoGrid({ summary, details }: DetailedInfoGridProps) {
  // Check if we have valid data - SummaryResult has radarScore.descriptions
  if (!summary || !details || !summary.radarScore || !summary.radarScore.descriptions || summary.radarScore.descriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Tổng hợp từ AI</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Chưa có phân tích chi tiết</p>
          <p className="text-sm text-gray-500 mt-1">Vui lòng thực hiện định giá để xem thông tin chi tiết</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Tổng hợp từ AI</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Use the first description as summary text */}
        <p className="text-muted-foreground mb-6">
          {summary.radarScore.descriptions.join(' ')}
        </p>
        <div className="grid grid-cols-1 gap-4">
          {criteriaConfig.map((item) => {
            const detailItem = details[item.key];
            // Skip if this detail item doesn't exist
            if (!detailItem) return null;
            
            return (
              <div key={item.key} className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">{item.title} (Điểm: {detailItem.score}/10)</h4>
                  <p className="text-sm text-muted-foreground">
                    {detailItem.details}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
