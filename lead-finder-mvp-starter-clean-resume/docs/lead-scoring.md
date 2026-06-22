# Lead Scoring Logic

The tool is for selling websites to businesses.

## Basic rules

```text
No website = Gold
Website unreachable/dead = Gold
Website present = Lower priority until checked
High rating + high reviews + no website = Strong Gold
Missing phone = weaker lead
```

## Initial scoring output

Each lead should include:

```text
leadStatus
leadReason
```

Examples:

```text
Gold | No website listed. Good outreach target.
Strong Gold | No website listed and strong review count.
Review | Website listed. Check quality manually.
Weak | Missing phone and low review count.
```

## Later website-quality checks

Future checks can classify:

```text
No website
Dead website
Parked domain
Old/basic site
Decent site
Strong modern site
```
