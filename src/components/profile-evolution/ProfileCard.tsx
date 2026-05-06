import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Trash2, BarChart, TrendingUp, FileText } from 'lucide-react';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { ProfileEvolution, ProfileEvolutionAnalysis } from './types';
import { getProfileValue, getDimensionLabel, getProfileColorHex } from './utils';

interface ProfileCardProps {
  profile: ProfileEvolution;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function ProfileCard({ profile, onDelete, onRefresh }: ProfileCardProps) {
  const repnaColors = [
    { letter: 'R', color: '#f97316' },
    { letter: 'E', color: '#eab308' },
    { letter: 'P', color: '#3b82f6' },
    { letter: 'N', color: '#22c55e' },
    { letter: 'A', color: '#9333ea' },
  ];

  return (
    <Card className="gradient-card border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5" />
              {profile.year}
            </CardTitle>
            <CardDescription className="mt-1">{profile.employee_name || 'Colaborador'}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <EditProfileDialog
              profileId={profile.id}
              currentData={{
                r: getProfileValue(profile, 'r'),
                e: getProfileValue(profile, 'e'),
                p: getProfileValue(profile, 'p'),
                n: getProfileValue(profile, 'n'),
                a: getProfileValue(profile, 'a'),
                tomada_decisoes: getProfileValue(profile, 'tomada_decisoes'),
                intensidade_perfil: getProfileValue(profile, 'intensidade_perfil'),
                energia: getProfileValue(profile, 'energia'),
                equilibrio_energia: getProfileValue(profile, 'equilibrio_energia'),
                modificacao_perfil: getProfileValue(profile, 'modificacao_perfil'),
              }}
              onSuccess={onRefresh}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(profile.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* REPNA Grid + Energy Bar */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
            {/* REPNA Grid Chart */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Perfil Comportamental REPNA
              </h4>
              <div className="bg-muted/20 rounded-lg p-6">
                <svg viewBox="0 0 550 400" className="w-full h-auto">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((line) => (
                    <g key={line}>
                      <line
                        x1="50"
                        y1={350 - line * 3}
                        x2="550"
                        y2={350 - line * 3}
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                      <text x="30" y={355 - line * 3} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="12">
                        {line}
                      </text>
                    </g>
                  ))}

                  {/* Bars */}
                  {['r', 'e', 'p', 'n', 'a'].map((key, index) => {
                    const value = getProfileValue(profile, key);
                    const barHeight = value * 3;
                    return (
                      <g key={key}>
                        <rect
                          x={50 + index * 100 + 20}
                          y={350 - barHeight}
                          width="60"
                          height={barHeight}
                          fill={getProfileColorHex(key)}
                          rx="4"
                        />
                        <text
                          x={50 + index * 100 + 50}
                          y={340 - barHeight}
                          textAnchor="middle"
                          fill="hsl(var(--foreground))"
                          fontSize="14"
                          fontWeight="bold"
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}

                  {/* Labels */}
                  {['R', 'E', 'P', 'N', 'A'].map((letter, index) => (
                    <text
                      key={letter}
                      x={50 + index * 100 + 50}
                      y="370"
                      textAnchor="middle"
                      fill="hsl(var(--foreground))"
                      fontSize="20"
                      fontWeight="bold"
                    >
                      {letter}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Energy Bar */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Energia (NE)
              </h4>
              <div className="bg-muted/20 rounded-lg p-6 flex flex-col items-center justify-center h-[400px]">
                <div className="flex flex-col items-center gap-2 h-full w-full max-w-[120px]">
                  <div className="text-2xl font-bold text-green-500">+</div>
                  <div className="flex-1 w-full relative bg-muted rounded-lg overflow-hidden flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-primary to-primary/60 transition-all duration-500 rounded-lg"
                      style={{ height: `${profile.analysis_result?.energia || 0}%` }}
                    />
                  </div>
                  <div className="text-2xl font-bold text-red-500">-</div>
                </div>
                <div className="text-3xl font-bold text-primary mt-4">{profile.analysis_result?.energia || 0}%</div>
              </div>
            </div>
          </div>

          {/* Indicadores Horizontais */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Indicadores
            </h4>
            <div className="grid gap-3">
              {['tomada_decisoes', 'intensidade_perfil', 'equilibrio_energia', 'modificacao_perfil'].map((key) => {
                const value = profile.analysis_result?.[key as keyof ProfileEvolutionAnalysis];
                if (typeof value !== 'number') return null;
                return (
                  <div key={key} className="flex items-center gap-4">
                    <span className="font-medium text-sm min-w-[180px]">{getDimensionLabel(key)}</span>
                    <div className="flex-1 relative h-8 bg-muted rounded-lg overflow-hidden">
                      <div className="absolute left-0 top-0 h-full bg-primary transition-all rounded-lg" style={{ width: `${value}%` }} />
                    </div>
                    <span className="text-lg font-bold text-primary min-w-[50px] text-right">{value}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Table */}
          <div className="pt-4 border-t border-border">
            <div className="rounded-lg overflow-hidden shadow-lg">
              <div className="grid grid-cols-6 text-center text-white font-bold">
                <div className="py-4 px-2 bg-primary">Perfil</div>
                {repnaColors.map(({ letter, color }) => (
                  <div key={letter} className="py-4 px-2" style={{ backgroundColor: color }}>
                    {letter}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-6 text-center text-white font-semibold text-lg">
                <div className="py-3 px-2 bg-primary/90">{profile.year}</div>
                {['r', 'e', 'p', 'n', 'a'].map((key, index) => (
                  <div key={key} className="py-3 px-2" style={{ backgroundColor: `${repnaColors[index].color}dd` }}>
                    {getProfileValue(profile, key)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          {profile.notes && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/20">
                <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Observações</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
