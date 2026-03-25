import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Invoice } from "@shared/schema";
import { format } from "date-fns";
import { FileText, Download, Eye } from "lucide-react";

export default function ProfileInvoices() {
  const { t, language } = useLanguage();
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  if (isLoading) return <div className="p-8 text-center">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-display">{language === 'ar' ? 'فواتيري' : 'My Invoices'}</h2>
      <div className="grid gap-4">
        {invoices?.length === 0 ? (
          <p className="text-muted-foreground">{language === 'ar' ? 'لا يوجد فواتير حالياً' : 'No invoices found'}</p>
        ) : (
          invoices?.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 bg-white border border-black/5 hover-elevate">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/5 flex items-center justify-center rounded-none">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(invoice.issueDate), 'yyyy-MM-dd')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold">{invoice.total} {t('currency')}</span>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-black/5 transition-colors" title={language === 'ar' ? 'عرض' : 'View'}>
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-black/5 transition-colors" title={language === 'ar' ? 'تحميل' : 'Download'}>
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
