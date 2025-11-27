import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, BookOpen, Target, MessageCircle, ClipboardCheck, TrendingUp, FlagIcon } from 'lucide-react';
import { PDI_GUIDE } from '@/data/pdiTemplates';

export default function PDIGuide() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);

  const stepIcons = [Target, MessageCircle, ClipboardCheck, TrendingUp, FlagIcon];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/pdi')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-8 w-8" />
                Guia para Condução do PDI
              </h1>
              <p className="text-muted-foreground mt-1">
                Orientações e melhores práticas para implementar PDIs eficazes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Introdução */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sobre este Guia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este guia tem o objetivo de dar suporte para o profissional que irá acompanhar o colaborador 
              no seu processo de PDI. Saber fazer as perguntas certas e gerar um espaço de construção é 
              fundamental para o sucesso do PDI. Para isso, indicamos seguir as seguintes etapas:
            </p>
          </CardContent>
        </Card>

        {/* Steps Navigation */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {PDI_GUIDE.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <button
                key={step.number}
                onClick={() => setActiveStep(step.number)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeStep === step.number
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Icon className={`h-6 w-6 ${activeStep === step.number ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className={`text-sm font-medium ${activeStep === step.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.number}. {step.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Content */}
        {PDI_GUIDE.steps.map((step) => {
          if (step.number !== activeStep) return null;
          const Icon = stepIcons[step.number - 1];

          return (
            <Card key={step.number} className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-primary" />
                  Etapa {step.number}: {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Objetivo:</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Dicas e Orientações:</h3>
                    <ul className="space-y-2">
                      {step.tips.map((tip, index) => (
                        <li key={index} className="flex gap-2 text-muted-foreground">
                          <span className="text-primary">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Metodologias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* SMART Methodology */}
          <Card>
            <CardHeader>
              <CardTitle>📌 {PDI_GUIDE.methodology.smart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{PDI_GUIDE.methodology.smart.description}</p>
              <div className="space-y-3">
                {PDI_GUIDE.methodology.smart.items.map((item) => (
                  <div key={item.letter} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">{item.letter}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 70|20|10 Methodology */}
          <Card>
            <CardHeader>
              <CardTitle>📊 {PDI_GUIDE.methodology.learning70_20_10.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{PDI_GUIDE.methodology.learning70_20_10.description}</p>
              <div className="space-y-4">
                {PDI_GUIDE.methodology.learning70_20_10.distribution.map((item) => (
                  <div key={item.percentage} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-primary">{item.percentage}</span>
                      <span className="text-sm text-muted-foreground">{item.actions}</span>
                    </div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Follow-up Questions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>💬 Perguntas Norteadoras para Acompanhamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Use estas perguntas durante os check-ins de acompanhamento:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PDI_GUIDE.followUpQuestions.map((question, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="text-primary mt-1">❓</span>
                  <span className="text-muted-foreground">{question}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Closure Questions */}
        <Card>
          <CardHeader>
            <CardTitle>🏁 Perguntas Norteadoras para Fechamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Use estas perguntas na sessão de fechamento do PDI:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PDI_GUIDE.closureQuestions.map((question, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="text-primary mt-1">❓</span>
                  <span className="text-muted-foreground">{question}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button size="lg" onClick={() => navigate('/pdi/new')}>
            Começar a Criar um PDI
          </Button>
        </div>
      </div>
    </div>
  );
}
