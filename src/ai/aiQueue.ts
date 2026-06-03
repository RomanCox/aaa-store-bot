import Bottleneck from "bottleneck";

export const aiLimiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 200,
});