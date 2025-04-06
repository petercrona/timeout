# Timeout

Inspired by how children, or adults, may sometimes benefit from a timeout - a little break in a calm environment to calm down - I wanted to try the same for annoying bots.

Banning bots is not uncommon, e.g. https://github.com/fail2ban/fail2ban is an example of banning based on failed SSH attempts.

The special thing about this project is that I'm trying to ban for a very short time, e.g. 1s, to significantly limit number of requests from aggresive bots 
while minimizing impact from false positives.

## Try it

`node index.js` - there are no dependencies.

The IPs are generated from 192.168.0.1 and incrementing. So you should see `192.168.0.1 - 192.168.0.5` be banned, as the simulation goes as:

1. 50reqs/s from 20 different IPs
2. 100reqs/s where 95% comes from 5 IPs (`192.168.0.1 - 192.168.0.5`) and 5% from 20 IPs.
3. 50reqs/s from 10 different IPs.

The detection reacts to that we suddenly see a lot more requests per IP, and further investigation shows that `192.168.0.1 - 192.168.0.5` send a surprisingly large number of requests. So we ban them for 1s.

## How it works

We sample every 50 requests and compute requests per IP based on these. We store both variance and mean in a baseline model.

When a new sample comes in, we assume our baseline model is true and has distribution `T-Dist(baselineModelAverage, baselineModelVariance)`. 
Using this assumption, we perform an upper tail T-test (in other words we answer: "is the new sample showing surprisingly high reqs/IP?"). 
If yes, we look at the IP distribution and give those that sent a surprisingly high number of requests timeout for a second.

The beauty is that if we manage to catch an IP and give timeout, the other involved in the DDOS will be more likely to be caught. 
However, the assumption is that the number of IPs is limited, which in my experience often holds true for smaller companies that are not specifically targeted, 
but just happen to meet an annoyingly aggresive bot.

## Exponential and Chi-Square Distribution

In the initial version (first commit) I was very happy to realize that inter-arrival times follow an exponential distribution, and the average of samples follow a gamma distribution, which can always be
transformed into a chisquared. The first commit in this repo has a version of that. I may explorer that more. It seems to work really well for detecting request spikes.
