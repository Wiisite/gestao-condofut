import escolaFutLogoPath from "@assets/escolafut_logo.png";

interface InterLogoProps {
  size?: number;
  className?: string;
}

export function InterLogo({ size = 40, className = "" }: InterLogoProps) {
  return (
    <img 
      src={escolaFutLogoPath} 
      alt="EscolaFut - Sistema de Gestão" 
      width={size} 
      height={size}
      className={`object-contain ${className}`}
    />
  );
}