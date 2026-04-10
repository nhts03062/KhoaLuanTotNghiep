import { NotFoundException } from '@nestjs/common';
import { PtMonthlyRewardPayoutSource, PtMonthlyRewardPayoutStatus } from 'generated/prisma/enums';
import { PtKpiService } from './pt-kpi.service';

describe('PtKpiService', () => {
  const prismaMock = {
    ptMonthlyRewardPayout: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: PtKpiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PtKpiService(prismaMock as any);
  });

  it('throws not found when overriding missing payout', async () => {
    prismaMock.ptMonthlyRewardPayout.findUnique.mockResolvedValue(null);

    await expect(
      service.updatePayout('admin-1', 'missing-id', { amountFinal: 100000 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('sets MANUAL_OVERRIDE and approvedByAdmin when overriding payout', async () => {
    prismaMock.ptMonthlyRewardPayout.findUnique.mockResolvedValue({ id: 'p1' });
    prismaMock.ptMonthlyRewardPayout.update.mockResolvedValue({
      id: 'p1',
      source: PtMonthlyRewardPayoutSource.MANUAL_OVERRIDE,
      amountFinal: 200000,
      status: PtMonthlyRewardPayoutStatus.APPROVED,
      approvedByAdminId: 'admin-1',
    });

    await service.updatePayout('admin-1', 'p1', {
      amountFinal: 200000,
      status: PtMonthlyRewardPayoutStatus.APPROVED,
      note: 'approved',
    });

    expect(prismaMock.ptMonthlyRewardPayout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({
          source: PtMonthlyRewardPayoutSource.MANUAL_OVERRIDE,
          approvedByAdminId: 'admin-1',
          amountFinal: 200000,
          status: PtMonthlyRewardPayoutStatus.APPROVED,
        }),
      }),
    );
  });

  it('finalizePreviousMonth delegates to finalizeMonth', async () => {
    const keySpy = jest
      .spyOn(service, 'getPreviousMonthKey')
      .mockReturnValue('2026-04');
    const finalizeSpy = jest.spyOn(service, 'finalizeMonth').mockResolvedValue({
      message: 'ok',
      data: { monthKey: '2026-04', processed: 0 },
    });

    await service.finalizePreviousMonth();

    expect(keySpy).toHaveBeenCalled();
    expect(finalizeSpy).toHaveBeenCalledWith('2026-04');
  });
});
