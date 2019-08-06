import {
    blockchainTests,
    constants,
    describe,
    expect,
    hexRandom,
} from '@0x/contracts-test-utils';
import { ExchangeRevertErrors } from '@0x/order-utils';
import { OrderInfo, OrderStatus, OrderWithoutDomain as Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceipt } from 'ethereum-types';
import * as ethjs from 'ethereumjs-util';
import * as _ from 'lodash';

import {
    artifacts,
    TestWrapperFunctionsContract,
    TestWrapperFunctionsFillOrderCalledEventArgs as FillOrderCalledEventArgs,
} from '../src';

blockchainTests.only('Exchange wrapper functions unit tests.', env => {
    const { ONE_ETHER } = constants;
    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomAssetData = () => hexRandom(34);
    const randomSignature = () => `${hexRandom(65)}02`;
    const randomAmount = (maxAmount: BigNumber = ONE_ETHER) => maxAmount.times(_.random(0, 100, true).toFixed(12));
    const randomTimestamp = () => new BigNumber(Math.floor(_.now() / 1000) + _.random(0, 34560));
    const randomSalt = () => new BigNumber(hexRandom(constants.WORD_LENGTH).substr(2), 16);
    let testContract: TestWrapperFunctionsContract;

    before(async () => {
        testContract = await TestWrapperFunctionsContract.deployFrom0xArtifactAsync(
            artifacts.TestWrapperFunctions,
            env.provider,
            env.txDefaults,
        );
    });

    function createRandomOrder(fields?: Partial<Order>): Order {
        return _.assign({
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            feeRecipientAddress: randomAddress(),
            senderAddress: randomAddress(),
            takerAssetAmount: randomAmount(),
            makerAssetAmount: randomAmount(),
            makerFee: randomAmount(),
            takerFee: randomAmount(),
            expirationTimeSeconds: randomTimestamp(),
            salt: randomSalt(),
            makerAssetData: randomAssetData(),
            takerAssetData: randomAssetData(),
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
        }, fields);
    }

    // Computes the expected (fake) order hash generated by the `TestWrapperFunctions` contract.
    function getExpectedOrderHash(order: Order): string {
        // It's just `keccak256(order.salt)`.
        return ethjs.bufferToHex(ethjs.sha3(ethjs.setLengthLeft(
            `0x${order.salt.toString(16)}`, constants.WORD_LENGTH)));
    }

    type AsyncFunction<TArgs extends any[], TResult> = (...args: TArgs) => Promise<TResult>;

    interface MutableContractFunction<
        TCallAsyncArgs extends any[],
        TAwaitTransactionSuccessAsyncArgs extends any[],
        TCallAsyncResult,
    > {
        callAsync: AsyncFunction<TCallAsyncArgs, TCallAsyncResult>;
        awaitTransactionSuccessAsync: AsyncFunction<TAwaitTransactionSuccessAsyncArgs, TransactionReceipt>;
    }

    async function getResultAndTransactAsync<
        TCallAsyncArgs extends any[],
        TAwaitTransactionSuccessAsyncArgs extends any[],
        TCallAsyncResult,
    >(
        contractFunction: MutableContractFunction<TCallAsyncArgs, TAwaitTransactionSuccessAsyncArgs, TCallAsyncResult>,
        // tslint:disable-next-line: trailing-comma
        ...args: TAwaitTransactionSuccessAsyncArgs
    ): Promise<[TCallAsyncResult, TransactionReceipt]> {
        // HACK(dorothy-zbornak): We take advantage of the general rule that
        // the parameters for `callAsync()` are a subset of the
        // parameters for `awaitTransactionSuccessAsync()`.
        const result = await contractFunction.callAsync(...args as any as TCallAsyncArgs);
        const receipt = await contractFunction.awaitTransactionSuccessAsync(...args);
        return [ result, receipt ];
    }

    describe('getOrdersInfo', () => {
        // Computes the expected (fake) order info generated by the `TestWrapperFunctions` contract.
        function getExpectedOrderInfo(order: Order): OrderInfo {
            const MAX_ORDER_STATUS = OrderStatus.Cancelled;
            return {
                orderHash: getExpectedOrderHash(order),
                // Lower uint128 of `order.salt` is the `orderTakerAssetFilledAmount`.
                orderTakerAssetFilledAmount: order.salt.mod(new BigNumber(2).pow(128)),
                // High byte of `order.salt` is the `orderStatus`.
                orderStatus: order.salt.dividedToIntegerBy(
                    new BigNumber(2).pow(248)).toNumber() % (MAX_ORDER_STATUS + 1),
            };
        }

        it('works with no orders', async () => {
            const infos = await testContract.getOrdersInfo.callAsync([]);
            expect(infos.length).to.eq(0);
        });

        it('works with one order', async () => {
            const orders = [ createRandomOrder() ];
            const expected = orders.map(getExpectedOrderInfo);
            const actual = await testContract.getOrdersInfo.callAsync(orders);
            expect(actual).to.deep.eq(expected);
        });

        it('works with many orders', async () => {
            const NUM_ORDERS = 16;
            const orders = _.times(NUM_ORDERS, () => createRandomOrder());
            const expected = orders.map(getExpectedOrderInfo);
            const actual = await testContract.getOrdersInfo.callAsync(orders);
            expect(actual).to.deep.eq(expected);
        });
    });

    describe('fillOrKillOrder', () => {
        it('reverts if the order is filled by less than `takerAssetFillAmount`', async () => {
            const fillAmount = randomAmount();
            const order = createRandomOrder({
                // `_fillOrder()` is overridden to always return `order.takerAssetAmount` as
                // the `takerAssetFilledAmount`.
                takerAssetAmount: fillAmount.minus(1),
            });
            const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                getExpectedOrderHash(order),
            );
            const tx = testContract.fillOrKillOrder.awaitTransactionSuccessAsync(
                order,
                fillAmount,
                randomSignature(),
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('reverts if the order is filled by greater than `takerAssetFillAmount`', async () => {
            const fillAmount = randomAmount();
            const order = createRandomOrder({
                // `_fillOrder()` is overridden to always return `order.takerAssetAmount` as
                // the `takerAssetFilledAmount`.
                takerAssetAmount: fillAmount.plus(1),
            });
            const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                getExpectedOrderHash(order),
            );
            const tx = testContract.fillOrKillOrder.awaitTransactionSuccessAsync(
                order,
                fillAmount,
                randomSignature(),
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('works if the order is filled by exactly `takerAssetFillAmount`', async () => {
            const fillAmount = randomAmount();
            const order = createRandomOrder({
                // `_fillOrder()` is overridden to always return `order.takerAssetAmount` as
                // the `takerAssetFilledAmount`.
                takerAssetAmount: fillAmount,
            });
            // const expected = getExpectedFillResults(order, fillAmount);
            const actual = await getResultAndTransactAsync(
                testContract.fillOrKillOrder,
                order,
                fillAmount,
                randomSignature(),
            );
            // expect(actual).to.deep.eq(expected);
        });
    });
});
