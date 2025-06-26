import { getTemplate, updateTemplate } from '@/api/apiEndpoints';
import SvgEditor from '@/components/Admin/ToolBuilder/SvgEditor'
import type { Template } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function SvgTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Fetch template data
  const { data, isLoading } = useQuery<Template>({
    queryKey: ["template", id],
    queryFn: () => getTemplate(id as string),
    enabled: !!id, // Only run query if id exists
  });

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: (templateData: { name: string; svg: string }) => 
      updateTemplate(id as string, templateData),
    onSuccess: () => {
      toast.success('Template saved successfully!');
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      // Optionally navigate back or refresh
      // navigate('/admin/templates');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to save template');
    }
  });

  const handleSave = (templateData: { name: string; svg: string }) => {
    if (!templateData.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    
    saveMutation.mutate(templateData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-muted-foreground">Loading template...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Template not found</h3>
          <p className="text-muted-foreground">The requested template could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <SvgEditor 
        svgRaw={data.svg} 
        templateName={data.name}
        onSave={handleSave}
        isLoading={saveMutation.isPending}
      />
    </div>
  );
}