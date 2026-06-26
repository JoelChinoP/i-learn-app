import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
interface ExportButtonProps {
  label?: string;
  onExport: () => void;
  successMessage?: string;
  variant?: 'default' | 'outline' | 'secondary';
}
/** Botón de exportación reutilizable (Instructor, Padre) con toast de confirmación. */
export function ExportButton({
  label = 'Exportar',
  onExport,
  successMessage = 'Reporte exportado',
  variant = 'outline'
}: ExportButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => {
        onExport();
        toast.success(successMessage);
      }}>
      
      <Download className="size-4" /> {label}
    </Button>);

}
