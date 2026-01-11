import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, FileText, AlertTriangle } from "lucide-react";

const Dmca = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
            Política DMCA
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Digital Millennium Copyright Act - Política de Direitos Autorais
          </p>
        </div>

        <div className="space-y-8">
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Sobre o DMCA
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                O Wolftoon respeita os direitos de propriedade intelectual de terceiros e espera que os usuários 
                do nosso serviço façam o mesmo. Em conformidade com o Digital Millennium Copyright Act (DMCA), 
                responderemos prontamente a reclamações de violação de direitos autorais que sejam reportadas 
                ao nosso Agente Designado.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Notificação de Violação
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none space-y-4">
              <p className="text-muted-foreground">
                Se você acredita que seu trabalho protegido por direitos autorais foi copiado de uma maneira 
                que constitui violação de direitos autorais, forneça ao nosso Agente Designado as seguintes informações:
              </p>
              <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                <li>Uma assinatura física ou eletrônica do proprietário dos direitos autorais ou pessoa autorizada</li>
                <li>Identificação da obra protegida por direitos autorais que você alega ter sido violada</li>
                <li>Identificação do material que você alega estar infringindo e sua localização no site</li>
                <li>Seu endereço, número de telefone e endereço de e-mail</li>
                <li>Uma declaração de que você acredita de boa-fé que o uso contestado não é autorizado</li>
                <li>Uma declaração, sob pena de perjúrio, de que as informações fornecidas são precisas</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Como Enviar uma Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none space-y-4">
              <p className="text-muted-foreground">
                Para enviar uma notificação DMCA, entre em contato conosco através do nosso servidor do Discord:
              </p>
              <div className="bg-primary/10 p-4 rounded-lg">
                <a 
                  href="https://discord.gg/6wUg8wssQv" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  discord.gg/6wUg8wssQv
                </a>
              </div>
              <p className="text-muted-foreground text-sm">
                Ao enviar uma notificação DMCA, você pode ser responsabilizado por danos (incluindo custos e 
                honorários advocatícios) se declarar falsamente que o material está infringindo seus direitos autorais.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle>Contra-Notificação</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none space-y-4">
              <p className="text-muted-foreground">
                Se você acredita que seu material foi removido por engano, você pode enviar uma contra-notificação 
                contendo:
              </p>
              <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                <li>Sua assinatura física ou eletrônica</li>
                <li>Identificação do material removido e sua localização anterior</li>
                <li>Uma declaração sob pena de perjúrio de que você acredita que o material foi removido por erro</li>
                <li>Seu nome, endereço, número de telefone e consentimento à jurisdição</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle>Política de Reincidentes</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                O Wolftoon adota uma política de encerramento de contas de usuários que sejam considerados 
                infratores reincidentes em circunstâncias apropriadas. Reservamo-nos o direito de, a nosso 
                exclusivo critério, limitar o acesso ao site e/ou encerrar as contas de quaisquer usuários 
                que infrinjam quaisquer direitos de propriedade intelectual de terceiros.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
};

export default Dmca;