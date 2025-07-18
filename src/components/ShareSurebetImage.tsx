import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/bet-utils";
import html2canvas from "html2canvas";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ui/theme-provider";

interface ShareSurebetImageProps {
  data: {
    bets: Array<{
      odds: number;
      stake: number;
      commission: number;
    }>;
    surebetPercentage: number;
    totalInvestment: number;
    guaranteedProfit: number;
    date: string;
  };
  onClose: () => void;
}

const ShareSurebetImage: React.FC<ShareSurebetImageProps> = ({ data, onClose }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hideValues, setHideValues] = useState(false);
  const { theme } = useTheme();
  
  // Detecta se está no tema dark
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  // Cores baseadas no tema
  const imageColors = {
    background: isDark ? "from-gray-900 to-gray-800" : "from-neutral-100 to-neutral-200",
    cardBackground: isDark ? "from-gray-800 to-gray-700" : "from-blue-50 to-blue-100",
    cardBorder: isDark ? "border-gray-600" : "border-blue-200",
    titleColor: isDark ? "text-white" : "text-primary",
    labelColor: isDark ? "text-gray-300" : "text-blue-700",
    textColor: isDark ? "text-gray-100" : "text-neutral-800",
    successColor: isDark ? "text-green-400" : "text-green-600",
  };

  const generateImage = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
      });
      const imageUrl = canvas.toDataURL("image/png");
      setPreviewImage(imageUrl);
    } catch (error) {
      console.error("Erro ao gerar a imagem:", error);
      alert("Ocorreu um erro ao gerar a imagem.");
      onClose();
    }
  };

  const handleShare = async () => {
    if (!previewImage) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Surebet Encontrada",
          text: `Encontrei uma oportunidade de surebet com lucro garantido de ${formatCurrency(data.guaranteedProfit)}!`,
          files: [
            new File([await (await fetch(previewImage)).blob()], "surebet.png", {
              type: "image/png",
            }),
          ],
        });
      } else {
        navigator.clipboard.writeText(previewImage);
        alert("Imagem copiada para a área de transferência!");
      }
      onClose();
    } catch (error) {
      console.error("Erro ao compartilhar a imagem:", error);
      alert("Ocorreu um erro ao compartilhar a imagem.");
    }
  };

  useEffect(() => {
    generateImage();
  }, [hideValues, theme]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
        {/* Elemento oculto para renderizar a imagem */}
        <div
          ref={canvasRef}
          className={`absolute -top-[9999px] p-8 bg-gradient-to-br ${imageColors.background} w-[600px] flex flex-col gap-6`}
        >
          {/* Logo */}
          <img
            src="/logo.png"
            alt="Logo"
            className="w-auto h-auto -mb-16 -mt-16"
          />

          {/* Card com as informações */}
          <div className={`bg-gradient-to-br ${imageColors.cardBackground} rounded-2xl shadow-lg border ${imageColors.cardBorder} p-6 flex flex-col gap-4`}>
            <h2 className={`text-3xl font-extrabold ${imageColors.titleColor} tracking-tight`}>
              Surebet Encontrada!
            </h2>
            <div className={`flex flex-col gap-3 ${imageColors.textColor}`}>
              <p className="text-lg">
                <strong className={`font-bold ${imageColors.labelColor}`}>Data:</strong>{" "}
                <span className="font-medium">{data.date}</span>
              </p>
              
              <p className="text-lg">
                <strong className={`font-bold ${imageColors.labelColor}`}>Porcentagem de Surebet:</strong>{" "}
                <span className="font-medium">{data.surebetPercentage.toFixed(2)}%</span>
              </p>

              {data.bets.map((bet, index) => (
                <div key={index} className="mt-2">
                  <p className={`text-lg font-bold ${imageColors.labelColor}`}>Aposta {index + 1}:</p>
                  <div className="ml-4">
                    <p className="text-lg">
                      <strong className={`font-bold ${imageColors.labelColor}`}>Odd:</strong>{" "}
                      <span className="font-medium">{bet.odds.toFixed(2)}</span>
                    </p>
                    {!hideValues && (
                      <p className="text-lg">
                        <strong className={`font-bold ${imageColors.labelColor}`}>Stake:</strong>{" "}
                        <span className="font-medium">{formatCurrency(bet.stake)}</span>
                      </p>
                    )}
                    {bet.commission > 0 && (
                      <p className="text-lg">
                        <strong className={`font-bold ${imageColors.labelColor}`}>Comissão:</strong>{" "}
                        <span className="font-medium">{bet.commission.toFixed(2)}%</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {!hideValues && (
                <>
                  <p className="text-lg mt-4">
                    <strong className={`font-bold ${imageColors.labelColor}`}>Investimento Total:</strong>{" "}
                    <span className="font-medium">{formatCurrency(data.totalInvestment)}</span>
                  </p>
                  <p className="text-lg">
                    <strong className={`font-bold ${imageColors.labelColor}`}>Lucro Garantido:</strong>{" "}
                    <span className={`font-medium ${imageColors.successColor}`}>{formatCurrency(data.guaranteedProfit)}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Interface visível */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-white">
            Pré-visualização da Surebet
          </h3>
          {previewImage ? (
            <img
              src={previewImage}
              alt="Pré-visualização da surebet"
              className="w-full rounded-lg shadow-md"
            />
          ) : (
            <p className="text-gray-300">Gerando pré-visualização...</p>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="hide-values"
              checked={hideValues}
              onCheckedChange={(checked) => setHideValues(!!checked)}
            />
            <Label htmlFor="hide-values" className="text-sm text-gray-200">
              Esconder valores (Stakes, Investimento e Lucro)
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleShare} disabled={!previewImage}>
              Compartilhar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareSurebetImage;
