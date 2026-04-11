interface EditorPreviewProps {
  livePreview: string;
}

export function EditorPreview({ livePreview }: EditorPreviewProps) {
  return (
    <div className="p-2.5 w-full">
      {livePreview ? (
        <div className="w-full h-[300px] rounded-lg bg-white overflow-auto flex items-center justify-center">
          <div
            className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto [&_svg]:block"
            dangerouslySetInnerHTML={{ __html: livePreview }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-[200px] text-white/30 text-[11px]">
          Preview loading...
        </div>
      )}
    </div>
  );
}
