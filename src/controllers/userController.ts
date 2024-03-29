/* eslint-disable @typescript-eslint/no-unused-vars */
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

const saltRounds = 10;

export default {
  createUser: async (req: Request, res: Response) => {
    const { email, password, fullName, confirmPassword, birthDate } =
      req.body ?? {};
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: email },
        select: { email: true },
      });

      if (existingUser) {
        res
          .status(400)
          .json({ success: false, message: "User already exist." });
      }

      const hash = await bcrypt.hash(password, saltRounds);

      const splitFullName = fullName.split(" ");
      const firstName = splitFullName[0];
      const middleName = splitFullName[1];
      const lastName = splitFullName[2];

      const user = await prisma.user.create({
        data: {
          email: email,
          password: hash,
          firstName: firstName,
          middleName: middleName,
          lastName: lastName,
          birthDate: birthDate,
        },
      });
      res.status(201).json(user);
    } catch (err) {
      res
        .status(400)
        .json({ success: false, message: "Error on create user." });
    } finally {
      await prisma.$disconnect();
    }
  },

  login: async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    try {
      const login = await prisma.user.findUnique({
        where: { email },
        select: { email: true, password: true, type: true },
      });
      const match = await bcrypt.compare(password, String(login?.password));

      if (login?.email !== email || !match) {
        return res
          .status(400)
          .json({ success: false, message: "User not found." });
      }

      const token = jwt.sign({ email: email, type: login?.type }, "password");

      res.status(200).json({ jwt: `Bearer ${token}` });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect user." });
    } finally {
      await prisma.$disconnect();
    }
  },
};
