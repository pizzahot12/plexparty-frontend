import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      className,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-[#242424] border border-white/5',
      glass: 'bg-white/5 backdrop-blur-md border border-white/10',
      outlined: 'border-2 border-white/10 bg-transparent',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-200',
          variants[variant],
          paddings[padding],
          hover && 'hover:bg-white/10 hover:border-white/20 cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardMediaProps {
  src: string;
  alt: string;
  aspectRatio?: 'video' | 'square' | 'poster';
  overlay?: React.ReactNode;
  className?: string;
}

export const CardMedia: React.FC<CardMediaProps> = ({
  src,
  alt,
  aspectRatio = 'poster',
  overlay,
  className,
}) => {
  const ratios = {
    video: 'aspect-video',
    square: 'aspect-square',
    poster: 'aspect-[2/3]',
  };

  return (
    <div className={cn('relative overflow-hidden rounded-xl', ratios[aspectRatio], className)}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
          {overlay}
        </div>
      )}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return <div className={cn('p-4', className)}>{children}</div>;
};

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-4 pb-2', className)}>
      <div className="flex-1 min-w-0">
        {title && <h3 className="text-lg font-semibold text-white truncate">{title}</h3>}
        {subtitle && <p className="text-sm text-white/60 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};
