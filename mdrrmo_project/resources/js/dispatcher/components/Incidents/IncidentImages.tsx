import { Image } from 'lucide-react';
import EmptyState from '@/shared/components/EmptyState';

export default function IncidentImages({ images = [] }) {
    if (images.length === 0) {
        return (
            <EmptyState
                title="No images"
                description="No images attached to this incident."
                icon={Image}
            />
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, i) => (
                <a
                    key={i}
                    href={img.url ?? img.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/40 transition-colors group"
                >
                    <img
                        src={img.url ?? img.path}
                        alt={`Incident image ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </a>
            ))}
        </div>
    );
}
