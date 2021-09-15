import { Request, Response, Router } from "express";
import { param } from "express-validator";
import { validateRequest } from "../../middlewares";
import mongoose from "mongoose";
import { Property } from "../../models";
import { notDeletedCondition } from "../../util";
import { NotFoundError } from "../../errors";

const router = Router();

router.delete(
  "/:propertyId",
  [param("propertyId").notEmpty().isMongoId()],
  validateRequest,
  async (req: Request, res: Response) => {
    const { propertyId } = req.params;
    const user = req.user!;

    // Check if property exists
    const property = await Property.findOne({
      userId: user.id,
      _id: propertyId,
      ...notDeletedCondition,
    });
    if (!property) {
      throw new NotFoundError(`Property "${propertyId}" could not be found.`);
    }

    // We need to remove the property together with all transactions
    // for this property.
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // === Soft delete property
      property.isDeleted = true;
      await property.save({ session });
      // === END Soft delete property
    });
    session.endSession();

    return res.status(202).json({
      success: true,
      payload: property,
    });
  }
);

export { router as deletePropertyRouter };
