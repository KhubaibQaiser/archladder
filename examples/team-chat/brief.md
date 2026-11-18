# Brief: team chat app

A fictional product, used to show archladder's output. Not affiliated with any real company.

## The brief

Build a team chat app for companies. Members chat in channels and direct messages, see who is
online and who is typing, get unread counts and push notifications on mobile, search message
history, and share files. Each company is a workspace with its own members and admins.

## Interview answers

These are the answers given to archladder's interview, recorded so the example is reproducible.

- **Stack:** Elixir (Phoenix) on Fly.io, Postgres, S3-compatible object storage, web and mobile apps. Team of 8.
- **Users:** the default ladder, 1k to 10M daily active members.
- **Usage:** a member sends about 40 messages a day and stays connected about 8 hours. Each message fans out to everyone in the channel. Typical channel 20 members, the largest 50k.
- **Freshness:** messages and typing indicators under 300 ms. Presence may lag a few seconds.
- **Tenancy:** multi-tenant, workspaces from 3 members to 100k. A few very large workspaces.
- **Traffic shape:** office hours per time zone, Monday-morning peaks about 3x. All-hands announcements in the largest channels cause instant fan-out spikes.
- **Ordering and delivery:** messages in a channel must appear in the same order for everyone. No message may be lost after the sender sees it sent.
- **Geography:** global from 100k DAU. Enterprise workspaces may require EU data residency from 1M DAU.
- **Retention:** messages kept forever unless the workspace sets a policy. Search covers all history.
