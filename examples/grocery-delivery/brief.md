# Brief: grocery delivery app

A fictional product, used to show archladder's output. Not affiliated with any real company.

## The brief

Build an app-only grocery service. Customers order in a mobile app, pick a one-hour delivery slot
up to seven days ahead, and get the order from our own electric vans that run fixed routes per
neighbourhood. Prices are the same as in a supermarket, with no minimum fee when a slot is shared
with neighbours. Each warehouse ("hub") picks orders the night before. Customers can change an order
until 22:00 the evening before delivery and track the van live on delivery day.

## Interview answers

These are the answers given to archladder's interview, recorded so the example is reproducible.

- **Stack:** TypeScript (Node) services on AWS, Aurora Postgres, React Native app. Team of 12, prefers managed services.
- **Users:** the default ladder, 1k to 10M daily active customers.
- **Usage:** about 40 reads per customer per day (browse, basket, slots) and 4 writes. Read-heavy, about 10:1.
- **Traffic shape:** two daily peaks (lunch and 19:00 to 22:00 before the order cutoff), about 4x the average. Slot releases for holiday weeks cause 15x spikes for 30 minutes.
- **Consistency:** a delivery slot has a fixed van capacity and must never be oversold. Stock is reserved at checkout and confirmed at picking.
- **Real-time:** live van tracking on delivery day only, one-way, updates every 10 seconds.
- **Geography:** one country at 1k and 10k, three countries from 100k, each with its own hubs. No residency rules beyond GDPR.
- **Background work:** nightly pick lists per hub, route planning, payment capture after delivery, receipts by email.
