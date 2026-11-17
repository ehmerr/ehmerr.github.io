// Small bits of personality used across the site.

export const fortunes = [
  'It is never DNS. It was DNS.',
  'If you did it twice by hand, the third time is a script.',
  'A rollback you never tested is just a wish.',
  'Nothing is more permanent than a temporary VM.',
  'Every dashboard starts green and ends up as a Christmas tree.',
  'The cheapest server is the one that is asleep.',
  "Friday deploys are fine if you're on call for the weekend anyway.",
  'Monitoring is how you find out before the customer tweets.',
];

export const greetings = (hour) =>
  hour < 5
    ? 'up late? same. production never sleeps.'
    : hour < 12
      ? 'good morning. coffee first, kubectl second.'
      : hour < 17
        ? 'good afternoon. all pipelines green, for now.'
        : hour < 21
          ? 'good evening. no deploys after 6… unless?'
          : 'late shift, huh? the pager and I say hi.';
