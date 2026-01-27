import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

type CardProps = DivProps;

type CardHeaderProps = DivProps;

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

type CardContentProps = DivProps;

export function Card({ className = '', ...props }: CardProps) {
  return <div className={`rounded-2xl border bg-white ${className}`} {...props} />;
}

export function CardHeader({ className = '', ...props }: CardHeaderProps) {
  return <div className={`p-4 pb-2 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: CardTitleProps) {
  return <h3 className={`font-bold text-slate-800 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: CardContentProps) {
  return <div className={`p-4 pt-2 ${className}`} {...props} />;
}
