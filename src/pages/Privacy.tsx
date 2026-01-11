import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-8 text-center">
          Política de Privacidade
        </h1>
        
        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-6 md:p-8 prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <p className="text-muted-foreground mb-8">
              A sua privacidade é de suma importância para o Wolftoon. Esta Política de Privacidade 
              descreve como coletamos, usamos e protegemos suas informações pessoais ao usar nosso site.
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Informações que Coletamos</h2>
              <p className="text-muted-foreground">
                Coletamos informações que você nos fornece diretamente ao se registrar, como nome de usuário 
                e endereço de e-mail. Também podemos coletar automaticamente informações não-pessoais, 
                como seu endereço IP, tipo de navegador e páginas visitadas, para melhorar a experiência do usuário.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Como Usamos Suas Informações</h2>
              <p className="text-muted-foreground mb-4">Utilizamos as informações coletadas para:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Fornecer, operar e manter nosso site</li>
                <li>Melhorar, personalizar e expandir nosso site</li>
                <li>Entender e analisar como você usa nosso site</li>
                <li>Desenvolver novos produtos, serviços, recursos e funcionalidades</li>
                <li>Comunicar-se com você para atendimento ao cliente e atualizações</li>
                <li>Processar suas transações</li>
                <li>Detectar e prevenir fraudes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Compartilhamento de Informações</h2>
              <p className="text-muted-foreground">
                Não vendemos, trocamos ou transferimos de outra forma suas informações de identificação 
                pessoal a terceiros, exceto quando necessário para operar o site ou conforme exigido por lei.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Segurança de Dados</h2>
              <p className="text-muted-foreground">
                Implementamos uma variedade de medidas de segurança para manter a segurança de suas 
                informações pessoais quando você faz um pedido ou insere, envia ou acessa suas informações pessoais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Cookies</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies para ajudar a compilar dados agregados sobre o tráfego do site e a 
                interação do site para que possamos oferecer melhores experiências e ferramentas no futuro.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Seus Direitos de Proteção de Dados</h2>
              <p className="text-muted-foreground mb-4">
                Em certas circunstâncias, você tem os seguintes direitos de proteção de dados:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>O direito de acessar, atualizar ou excluir as informações que temos sobre você</li>
                <li>O direito de retificação</li>
                <li>O direito de se opor</li>
                <li>O direito de restrição</li>
                <li>O direito à portabilidade de dados</li>
                <li>O direito de retirar o consentimento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Alterações nesta Política de Privacidade</h2>
              <p className="text-muted-foreground">
                Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre 
                quaisquer alterações publicando a nova Política de Privacidade nesta página.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
