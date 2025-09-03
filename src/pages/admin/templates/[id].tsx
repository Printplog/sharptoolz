import { getTemplate, updateTemplate } from '@/api/apiEndpoints';
import SvgEditor from '@/components/Admin/ToolBuilder/SvgEditor'
import errorMessage from '@/lib/utils/errorMessage';
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

  console.log(data);

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (templateData: { name: string; svg: string; banner?: File | null; hot?: boolean; tool?: string }) => {
      try {
        // If there's a banner file, use FormData
        if (templateData.banner) {
          const formData = new FormData();
          formData.append('name', templateData.name);
          formData.append('svg', templateData.svg);
          formData.append('hot', templateData.hot ? 'true' : 'false');
          if (templateData.tool) {
            formData.append('tool', templateData.tool);
          }
          formData.append('banner', templateData.banner);
          const result = await updateTemplate(id as string, formData);
          console.log('FormData update result:', result);
          return result;
        } else {
          // Otherwise, send as JSON
          const result = await updateTemplate(id as string, {
            name: templateData.name,
            svg: templateData.svg,
            hot: templateData.hot || false,
            tool: templateData.tool || undefined
          });
          console.log('JSON update result:', result);
          return result;
        }
      } catch (error) {
        console.error('Update template error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Template saved successfully:', data);
      toast.success('Template saved successfully!');
      
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tool-categories"] });
      
      // Optionally navigate back or refresh
      // navigate('/admin/templates');
    },
    onError: (error: Error) => {
      console.error('Save template error:', error);
      toast.error(errorMessage(error));
    }
  });

  const handleSave = (templateData: { name: string; svg: string; banner?: File | null; hot?: boolean; tool?: string }) => {
    if (!templateData.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    
    console.log('Saving template data:', templateData);
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
        banner={data.banner}
        hot={data.hot}
        tool={data.tool}
        isLoading={saveMutation.isPending}
      />
    </div>
  );
}
