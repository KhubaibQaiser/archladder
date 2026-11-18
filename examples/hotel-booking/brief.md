# Brief: hotel booking marketplace

A fictional product, used to show archladder's output. Not affiliated with any real company.

## The brief

Build a hotel booking marketplace. Travellers search hotels by city, dates and guests, filter by
price, rating and amenities, and book a room with instant confirmation. Hotels manage their rooms,
rates and availability in an extranet, and many also sync through channel managers that push rate
and availability updates many times an hour. The marketplace earns a commission per stay.

## Interview answers

These are the answers given to archladder's interview, recorded so the example is reproducible.

- **Stack:** Java (Spring Boot) on Google Cloud, Cloud SQL for Postgres, a web app and mobile apps. Team of 20.
- **Users:** the default ladder, 1k to 10M daily active travellers.
- **Usage:** a traveller runs about 15 searches and 60 detail views per day. Search to booking is about 200:1. Very read-heavy.
- **Traffic shape:** steady daily cycle about 3x, plus flash sales and holiday campaigns that spike search 20x for a few hours, announced a week ahead.
- **Writes that matter:** bookings must never double-book the last room. Channel managers push about 50 rate or availability updates per hotel per day.
- **Freshness:** search results may lag availability by up to a minute. The booking step re-checks live availability.
- **Tenancy:** hotels are suppliers, from 10 rooms to 2,000. 2k hotels at 1k DAU, 500k hotels at 10M DAU, a few chains very large.
- **Geography:** global travellers from 10k DAU. Payments in local currencies. No residency rules beyond GDPR.
- **Real-time:** none for travellers. The extranet refreshes on load.
