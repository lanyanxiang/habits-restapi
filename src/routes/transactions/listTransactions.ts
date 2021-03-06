/*
 * Created by Jimmy Lan
 * Creation Date: 2021-08-22
 * Description:
 *   Route to list transactions with pagination for the signed-in user.
 *   Currently listing from the most recent to the least recent.
 */

import { Request, Response, Router } from "express";
import { query } from "express-validator";
import { Property, PropertyDocument, Transaction } from "../../models";
import { notDeletedCondition, validators } from "../../util";
import { ResBody } from "../../types";
import { validateRequest } from "../../middlewares";
import { NotFoundError } from "../../errors";
import { fixedQuota } from "../../config";

const router = Router();

/**
 * Query property with `propertyId` that belongs to the user with `userId`.
 * Return `undefined` if `propertyId` is `undefined` or a null value.
 * Throw an error if property is not found.
 * @throws NotFoundError Whenever property is not found.
 */
const queryProperty = async (userId: string, propertyId?: string) => {
  let property: PropertyDocument | undefined;
  if (propertyId) {
    const _property = await Property.findOne({
      _id: propertyId as string,
      userId,
      ...notDeletedCondition,
    });
    if (!_property) {
      throw new NotFoundError(
        `Could not locate property with ID ${propertyId}.`
      );
    }
    property = _property;
  }
  return property;
};

router.get(
  "/",
  [
    validators.pageLimit,
    validators.pageSkip,
    query("propertyId").isString().isMongoId().optional(),
  ],
  validateRequest,
  async (req: Request, res: Response<ResBody>) => {
    const { skip, limit, propertyId } = req.query;
    const user = req.user!;

    // Query requested property
    const property = await queryProperty(user.id, propertyId as string);

    // === Query transactions
    const findLimit: number = limit ? Number(limit) : 0;
    const findSkip: number = skip ? Number(skip) : 0;

    const findCondition: Record<string, any> = {
      userId: user.id,
      ...notDeletedCondition,
    };
    if (property) {
      findCondition.property = property;
    }

    const transactions = await Transaction.find(findCondition)
      .sort({ createdAt: "desc" })
      .populate("property", "name")
      .limit(Math.min(findLimit, fixedQuota.maxPageSize))
      .skip(findSkip)
      .exec();
    // === END Query transactions

    return res.send({
      success: true,
      payload: transactions,
    });
  }
);

export { router as listTransactionsRouter };
