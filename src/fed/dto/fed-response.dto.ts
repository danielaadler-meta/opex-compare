export class FedBucketBreakdown {
  opexBucket: string;
  totalActualCost: number;
  totalEstimatedCost: number;
  jobCount: number;
}

export class FedAggregatedResponseDto {
  businessUnit: string;
  periodYear: number;
  periodMonth: number;
  totalActualCost: number;
  totalEstimatedCost: number;
  recordCount: number;
  byOpexBucket?: FedBucketBreakdown[];
}
