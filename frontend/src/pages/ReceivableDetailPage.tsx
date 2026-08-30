import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { receivableDetailRoute } from '@/router';
import { receivableDetailQueryOptions } from '@/api/queries';
import { useCancelReceivable, useDeletePayment, useDeleteReceivable } from '@/api/mutations';
import { formatCzk } from '@/lib/money';
import { AddPaymentForm } from '@/components/receivables/AddPaymentForm';
import {
  formatDate,
  remainingOf,
  SOURCE_LABELS,
  STATUS_BADGE_VARIANTS,
  STATUS_LABELS,
  surplusOf,
} from '@/components/receivables/status';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function ReceivableDetailPage() {
  const { receivableId } = receivableDetailRoute.useParams();
  const id = Number(receivableId);
  const navigate = useNavigate();
  const { data, error } = useQuery(receivableDetailQueryOptions(id));
  const deletePayment = useDeletePayment(id);
  const cancelReceivable = useCancelReceivable(id);
  const deleteReceivable = useDeleteReceivable();

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6">
          <p className="text-sm text-muted-foreground">
            {error ? error.message : 'Pohledávka nenalezena.'}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/receivables">Zpět na pohledávky</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { receivable, payments } = data;
  const remaining = remainingOf(receivable);
  const surplus = surplusOf(receivable);
  const isSettled = receivable.status === 'paid' || receivable.status === 'cancelled';
  const actionError = deletePayment.error ?? cancelReceivable.error ?? deleteReceivable.error;

  async function handleDeleteReceivable() {
    await deleteReceivable.mutateAsync(id);
    navigate({ to: '/receivables' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl break-words">{receivable.title}</CardTitle>
        <CardDescription>
          {receivable.player_name} · {SOURCE_LABELS[receivable.source_type]}
          {receivable.due_date !== null && ` · splatnost ${formatDate(receivable.due_date)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {actionError && (
          <Alert variant="destructive">
            <AlertDescription>{actionError.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3">
          <Badge variant={STATUS_BADGE_VARIANTS[receivable.status]}>
            {STATUS_LABELS[receivable.status]}
          </Badge>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Částka</dt>
            <dd className="text-right font-medium tabular-nums">{formatCzk(receivable.amount)}</dd>
            <dt className="text-muted-foreground">Zaplaceno</dt>
            <dd className="text-right font-medium tabular-nums">
              {formatCzk(receivable.paid_total)}
            </dd>
            <dt className="font-medium">Zbývá</dt>
            <dd className="text-right font-medium tabular-nums">{formatCzk(remaining)}</dd>
          </dl>
          {surplus > 0 && (
            <p className="text-xs text-muted-foreground">
              Přeplatek {formatCzk(surplus)} — zaplaceno víc, než kolik pohledávka činí.
            </p>
          )}
          {receivable.description !== null && (
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {receivable.description}
            </p>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Platby ({payments.length})</h3>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Zatím žádná platba.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium tabular-nums">{formatCzk(payment.amount)}</span>
                    <span className="text-xs text-muted-foreground break-words">
                      {formatDate(payment.paid_at)}
                      {payment.note !== null && ` · ${payment.note}`}
                    </span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Smazat platbu"
                        className="shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Smazat platbu {formatCzk(payment.amount)}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Stav pohledávky se přepočítá podle zbývajících plateb.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Zrušit</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void deletePayment.mutateAsync(payment.id)}>
                          Smazat
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          )}
        </div>

        {receivable.status !== 'cancelled' && (
          <>
            <Separator />
            <AddPaymentForm receivable={receivable} />
          </>
        )}

        {/* A receivable is never edited: a mistake is either deleted (while no
            money has been recorded against it) or cancelled. */}
        {!isSettled && payments.length === 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-2 sm:flex-row">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    Zrušit pohledávku
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Zrušit pohledávku {receivable.title}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Zůstane v evidenci se stavem „Zrušeno“ a přestane se počítat mezi dluhy.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Zpět</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void cancelReceivable.mutateAsync()}>
                      Zrušit pohledávku
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    Smazat
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Smazat pohledávku {receivable.title}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Zmizí úplně. Tohle nelze vrátit zpět.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Zpět</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void handleDeleteReceivable()}>
                      Smazat
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}

        <Button asChild variant="ghost" size="sm" className="self-center">
          <Link to="/receivables">Zpět na pohledávky</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
