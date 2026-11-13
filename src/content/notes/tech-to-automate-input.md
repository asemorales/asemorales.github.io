---
title: "Use technology to automate input, not processing"
date: 2025-11-30
updated: 2026-11-03
tags: ["technology","guide"]
---

*Ceteris paribus*, the quality of what you produce is affected by three factors:
1. the quantity of what you consume
2. the quality of what you consume
3. your ability to synthesize[^1]

The last is a uniquely human activity, and should be so. Learning is the act of refining neural connections[^8], hence offloading synthesis is offloading learning.

The rest of this page is about how to automate the first two with technology.

## Limit the quantity of what you consume

For most people, the quantity of one's consumption is largely not a problem. If anything, it tends to be excessive to the point of detriment, and often needs to be limited to the extent that you are able to engage deeply where needed. Due to the internet's democratization of knowledge, abundance of short-form content, and recommender systems built into content and social media platforms, the act of consuming ideas from other people is systematically ingrained into the internet's culture[^7]. The primary bottleneck to the quantity of what you consume is your own ability to do so.

## Use systems to control the quality of what you consume

> [!quote]Will Manidis, [On Grindslop](https://minutes.substack.com/p/on-grindslop)
> In a world in which automation will collapse the cost of everything to basically zero, the only question that matters is what do you actually want. What do you consume. What do you put in your body. What you put in your heart. This is the only constraint left and it’s a constraint placed squarely on your character and your own sense of what’s beautiful and worthwhile.

### Recommender systems on content platforms

The quality of what you consume depends on how you use [recommender systems](https://en.wikipedia.org/wiki/Recommender_system), and whether you are using them intentionally. Left unchecked, recommender systems tend to either turn feeds to echo chambers or degrade feeds to content of mixed levels of quality. However, when used intentionally, recommender systems can automate the chore of sifting through data to serve you a continuous stream of highly valuable content.

You must intentionally teach recommender systems what constitutes good quality to you. When algorithms evaluate quality by engagement metrics[^5], this works in the favor of mainstream and entertaining content, but less so for any content that requires a certain level of prerequisite knowledge. Say you are an academic in complexity science. If so, engaging with complexity-related content is not enough. Because recommender systems choose for popularity, and the majority of users have no prerequisite knowledge of your field, the system is likely to only show you: a.) content on concepts you already know; or b.) content by popular thinkers in the field[^2]. For the purposes of learning, these are both insufficient. To change this, you must make a deliberate effort to mark content that is less valuable to you by using the "Show less" or "Not interested" options, engage with highly valuable content[^3], and actively seek out and follow people that produce highly valuable content despite being lesser known.

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

### Large language models

Useful techniques with [large language models](https://en.wikipedia.org/wiki/Large_language_model) (LLMs):

**Use LLMs as feed readers with recommender systems.** Set up recurring jobs/scheduled tasks to send you a weekly email or thread of updates that:
- are from credible or well-evidenced sources that you don't already know about (i.e. it must be outside the feeds or accounts you normally read from)
- include new findings/news that opposes your current beliefs or opposes the dominant paradigm in your field
- include pre-existing foundational work in your field that you may need to read or review based on [spaced repetition](https://en.wikipedia.org/wiki/Spaced_repetition)
- are adjacent to what you've recently been reading or working on (applies if you use LLMs to work frequently enough such that it has memory of you, or if it is connected to your reader applications via [model context protocol](https://en.wikipedia.org/wiki/Model_Context_Protocol))
- meet your criteria for the kinds of content you want to see (provide the LLM a list of specific criteria)

**Use LLMs to build habits.** If you frequently use LLMs and are actively trying to build a habit, set the system prompt to incorporate that habit. A few examples:
- to learn to debate your own reasoning, set it to prompt you to [steelman](https://en.wikipedia.org/wiki/Straw_man#Steelmanning) your beliefs, and help refine your steelmanned argument
- to build time-based habits, set it to check the time when it replies and remind you to do it, or not to allow further conversation until you've done the habit (useful for deep work sessions that often involve LLMs, especially for [neurodivergents](https://en.wikipedia.org/wiki/Neurodiversity), where usual alarms are less effective due to difficulty breaking a [flow state](https://en.wikipedia.org/wiki/Flow_%28psychology%29)
- to learn through discovery, set it to reply as an instructor using the [inquiry method](https://en.wikipedia.org/wiki/Inquiry_education)

[^1]: For the sake of simplification, assume this includes subfactors such as time and energy to produce, skill of synthesis, and so on.

[^2]: It is necessary but not sufficient to keep up-to-date with the popular developments and thinkers in a field. Good science should not depend on the merit of the author, but on the merit of the arguments. Tracking influence is useful insofar as it allows you to track the wider context of the field.

[^3]: Make an effort to upvote well-evidenced, high-quality content you want to continue seeing *regardless of whether you agree with the content*, rather than liking/upvoting solely on the basis of whether you agree. This is one way to avoid echo chambers. Note that this advice applies only to social media communities, and might not apply for primarily informational communities that equate upvotes with factual correctness (ex. [Stack Exchange](https://en.wikipedia.org/wiki/Stack_Exchange)).

[^5]: While this isn't the only way recommender systems choose what to recommend, this is how many systems handle [cold starts](https://en.wikipedia.org/wiki/Cold_start_%28recommender_systems%29). Once the system gains sufficient information about you and who you follow, content will more closely approximate your interests and the interests of those you follow. Hence, follow those whose taste and fields you want to emulate, rather than mainly following acquaintances.

[^6]: Many software organization principles, such as [separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns), [KISS](https://en.wikipedia.org/wiki/KISS_principle), and [DRY](https://en.wikipedia.org/wiki/Don't_repeat_yourself), apply well to personal systems.

[^7]: [Culturally default behaviors fill spare time with others’ ideas](https://notes.andymatuschak.org/zMmH3GBLKotdP4t1sdSvEQJ)

[^8]: See [[learning-is-connection|learning is the act of making connections]]
