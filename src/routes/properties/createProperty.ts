/*
 * Created by Jimmy Lan
 */

import { Request, Response, Router } from "express";
import { validateRequest } from "../../middlewares";
import { body } from "express-validator";
import { Property } from "../../models";
import { UnprocessableEntityError } from "../../errors";
import { ResBody } from "../../types";

const router = Router();

router.post(
  "/",
  [
    body("name")
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage(
        "Property name must be a string of length between 1 and 50."
      ),
    body("description")
      .isString()
      .isLength({ min: 2, max: 100 })
      .withMessage(
        "Property description must be a string of length between 2 and 100."
      )
      .optional(),
    body("amountInStock").isNumeric().optional(),
  ],
  validateRequest,
  async (req: Request, res: Response<ResBody>) => {
    const { name, description, amountInStock } = req.body;
    const user = req.user!;

    // Check if this user already has a property of the same name.
    const existingProperty = await Property.findOne({ userId: user.id, name });
    if (existingProperty) {
      throw new UnprocessableEntityError(
        `You already have a property with name "${name}".`
      );
    }

    // Add new property
    const property = Property.build({
      userId: user.id,
      name,
      description,
      amount: 0,
      amountInStock,
    });
    await property.save();

    return res.status(201).json({
      success: true,
      payload: property,
    });
  }
);

export { router as createPropertyRouter };
