import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-8 text-center">
          Termos de Uso
        </h1>
        
        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-6 md:p-8 prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar e usar o Wolftoon, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Uso do Serviço</h2>
              <p className="text-muted-foreground mb-4">
                O Wolftoon é uma plataforma de leitura de manhwas, manhuas e mangás. Ao usar nosso serviço, você concorda em:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Não usar o serviço para fins ilegais ou não autorizados</li>
                <li>Não tentar acessar áreas restritas do site sem autorização</li>
                <li>Não distribuir, modificar ou reproduzir o conteúdo sem permissão</li>
                <li>Não usar bots, scrapers ou outras ferramentas automatizadas</li>
                <li>Manter a confidencialidade de sua conta e senha</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Contas de Usuário</h2>
              <p className="text-muted-foreground">
                Ao criar uma conta no Wolftoon, você é responsável por manter a segurança de sua conta e todas as atividades 
                que ocorram sob ela. Você deve fornecer informações precisas e completas durante o registro. 
                Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Conteúdo do Usuário</h2>
              <p className="text-muted-foreground">
                Ao postar comentários ou outro conteúdo em nossa plataforma, você garante que possui os direitos necessários 
                e concede ao Wolftoon uma licença para usar, modificar e exibir esse conteúdo. 
                Não toleramos conteúdo ofensivo, discriminatório ou ilegal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Propriedade Intelectual</h2>
              <p className="text-muted-foreground">
                Todo o conteúdo disponível no Wolftoon, incluindo mas não limitado a textos, gráficos, logotipos, 
                ícones e imagens, é propriedade do Wolftoon ou de seus respectivos criadores e está protegido 
                por leis de direitos autorais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Assinatura VIP</h2>
              <p className="text-muted-foreground">
                A assinatura VIP oferece benefícios adicionais conforme descrito na página VIP. 
                O pagamento é processado mensalmente e pode ser cancelado a qualquer momento. 
                Não oferecemos reembolsos por períodos parciais de uso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground">
                O Wolftoon é fornecido "como está" sem garantias de qualquer tipo. 
                Não nos responsabilizamos por danos indiretos, incidentais ou consequentes 
                decorrentes do uso ou incapacidade de usar nosso serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Modificações</h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                Alterações significativas serão notificadas através do site. 
                O uso continuado do serviço após alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Contato</h2>
              <p className="text-muted-foreground">
                Para dúvidas sobre estes Termos de Uso, entre em contato conosco através da página de Contato.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
