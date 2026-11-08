---
title: "Use technology to automate input, not processing"
date: 2025-11-30
updated: 2026-11-03
tags: ["technology","guide"]
---

Ceteris paribus, the quality of what you produce is affected by three factors:
1. the quantity of what you consume
2. the quality of what you consume
3. your ability to synthesize[^1]

The last is a uniquely human activity, and should be so. Learning is the act of refining neural connections, hence offloading synthesis is offloading learning.

The rest of this page is about how to automate the first two with technology.

## Limit the quantity of what you consume

For most people, the quantity of one's consumption is largely not a problem. If anything, it tends to be excessive to the point of detriment, and often needs to be limited to the extent that you are able to engage deeply where needed. The internet's democratization of knowledge, abundance of short-form content, and recommender systems built into content and social media platforms makes it far too easy to be caught in a deluge of information. The primary bottleneck to the quantity of what you consume is your own ability to do so.

## Use systems to control the quality of what you consume

### Recommender systems on content platforms

The quality of what you consume depends on how you use [recommender systems](https://en.wikipedia.org/wiki/Recommender_system), and whether you are using them intentionally. Left unchecked, recommender systems tend to either turn feeds to echo chambers or degrade feeds to content of mixed levels of quality. However, when used intentionally, recommender systems can automate the chore of sifting through data to serve you a continuous stream of high-quality content.

You must intentionally teach recommender systems what constitutes good quality to you. When algorithms evaluate quality by engagement metrics[^5], this works in the favor of mainstream and entertaining content, but less so for any content that requires a certain level of prerequisite knowledge. Say you are an academic in complexity science. If so, engaging with complexity-related content is not enough. Because recommender systems choose for popularity, and the majority of users have no prerequisite knowledge of your field, the system is likely to only show you: a.) content on concepts you already know; or b.) content by popular thinkers in the field[^2]. For the purposes of learning, these are both insufficient. To change this, you must make a deliberate effort to mark low-quality content on your feed with the "Show less" or "Not interested" options, engage with high-quality content[^3], and actively seek out and follow people that produce high-quality content despite being lesser known.

A useful method to do this is to actively seek out one such person, then go through the list of others they follow, and follow people from that list. Repeat for those new people you follow. As a result of the [Matthew effect](https://en.wikipedia.org/wiki/Matthew_effect) and [homophily](https://en.wikipedia.org/wiki/Homophily) in social networks, being within a social circles makes it far easier to find others in similar domains, ideas, and circles. This is true of both thinkers and their works. Good knowledge is built on and references many others.

### Mastodon

Since [Mastodon](https://en.wikipedia.org/wiki/Mastodon_%28social_network%29) does not show content based on recommender systems, and only shows content from users you have subscribed to, it is particularly useful when there exists an (active) server for the topic/s you are interested in. While it takes more effort to actively seek out people to follow based on their content, Mastodon servers tend to be relatively small and specialized, which acts like a pre-filter.

### Mailing lists, newsletter subscriptions, and feed readers

While subscribing to newsletters and mailing lists via email is a longstanding practice, [feed readers](https://en.wikipedia.org/wiki/News_aggregator) have several benefits over email subscriptions:
- Avoids clutter from websites that auto-subscribe you to their newsletter upon signup
- Separate content from email inbox[^6]
- Less chances of tracking or email address leaks
- More sources (YouTube channels, podcasts, forums, GitHub releases, changelogs, arXiv categories, journals)
- Avoids broken or missing unsubscribe links from email newsletters
- No switching costs (list of feeds can be exported)
- Improved customization, integration, widgets, etc.

Sites that do not clearly display their feed URLs typically have hidden links that feed readers can find with feed autodiscovery. This applies, for example, to Substack, Medium, YouTube, static and Wordpress sites, etc.

[^1]: For the sake of simplification, assume this includes subfactors such as time and energy to produce, skill of synthesis, and so on.

[^2]: It is necessary but not sufficient to keep up-to-date with the popular developments and thinkers in a field. Good science should not depend on the merit of the author, but on the merit of the arguments. Tracking influence is useful insofar as it allows you to track the wider context of the field.

[^3]: Make an effort to like/upvote well-grounded, high-quality content you want to continue seeing regardless of whether you agree with the content, rather than liking/upvoting solely on the basis of whether you agree. This is one way to avoid echo chambers. Note that this advice applies most to social media communities, and less so for entirely informational communities that equate upvotes with factual correctness (ex. Stack Exchange).

[^5]: While this isn't the only way recommender systems choose what to recommend, this is how many systems handle [cold starts](https://en.wikipedia.org/wiki/Cold_start_%28recommender_systems%29). Once the system gains sufficient information about you and who you follow, content will more closely approximate your interests and the interests of those you follow. Hence, follow those whose taste and fields you want to emulate, rather than mainly following acquaintances.

[^6]: Many software organization principles, such as [separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns), also apply well to personal systems.
