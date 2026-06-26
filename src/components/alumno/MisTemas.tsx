import { Play } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { MasteryBadge } from '../shared/MasteryBadge';
import { masteryMeta } from '../../lib/mastery';
import { MOCK_ALUMNO_TOPICS } from '../../data/mock';
/** Grid de "Mis temas": elegir qué practicar en vez de un único camino lineal. */
export function MisTemas({
  onPractice


}: {onPractice: (topic: string) => void;}) {
  // TODO: reemplazar por catálogo real de temas del alumno.
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-foreground">
        Mis temas
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MOCK_ALUMNO_TOPICS.map((t) => {
          const meta = masteryMeta(t.mastery);
          return (
            <Card key={t.topic} className="rounded-2xl">
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-foreground">{t.topic}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t.questions} preguntas disponibles
                    </p>
                  </div>
                  <MasteryBadge mastery={t.mastery} showValue />
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${meta.bar}`}
                    style={{
                      width: `${t.mastery}%`
                    }} />
                  
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onPractice(t.topic)}>
                  
                  <Play className="size-4" /> Practicar este tema
                </Button>
              </CardContent>
            </Card>);

        })}
      </div>
    </section>);

}
