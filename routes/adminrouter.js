const express = require("express");
const router = express.Router();
const Side = require("../model/side");
const Admin = require("../model/admin");
//admin register//
router.post("/admin", async (req, res) => {
  const { name, number, email, refName, paid, withdrawl } = req.body;

  if (
    !name ||
    !number ||
    !email ||
    !refName ||
    paid === undefined ||
    withdrawl === undefined
  ) {
    return res
      .status(400)
      .json({ status: false, message: "All fields are required" });
  }

  try {
    let upliner = 0;
    let withdrawlAmount = Number(paid);
    const find = await Side.findOne({ name: refName });
    console.log(find);
    if (!find) {
      return res.status(400).json({
        status: false,
        message: "Please provide a correct referral name.",
      });
    }
    let root = find;
    while (root.refName) {
      const parent = await Side.findOne({ name: root.refName });
      if (!parent) break;
      root = parent;
    }
    const allUsers = await Side.find({}, { name: 1, refName: 1, referrals: 1 });
    let referralTree = {};
    function buildTree(users) {
      let tree = {};
      let userMap = {};
      users.forEach((user) => {
        userMap[user.name] = { referrals: user.referrals || {} };
      });
      users.forEach((user) => {
        if (user.refName && userMap[user.refName]) {
          userMap[user.refName].referrals[user.name] = userMap[user.name];
        } else {
          tree[user.name] = userMap[user.name];
        }
      });

      return tree;
    }

    referralTree = buildTree(allUsers);
    function addReferral(tree, refName, newUser) {
      if (tree[refName]) {
        tree[refName].referrals[newUser] = { referrals: {} };
        return true;
      } else {
        for (let key in tree) {
          if (addReferral(tree[key].referrals, refName, newUser)) {
            return true;
          }
        }
      }
      return false;
    }
    addReferral(referralTree, refName, name);
    await Side.findByIdAndUpdate(root._id, {
      $set: { referrals: referralTree[root.name].referrals },
    });

    const id1 = find._id;
    let currentwithdrawl = Number(find.withdrawl);
    withdrawlAmount = currentwithdrawl + (50 / 100) * withdrawlAmount;
    await Side.findByIdAndUpdate(id1, {
      $set: { withdrawl: withdrawlAmount },
    });
    upliner++;

    if (find.refName) {
      const nextfind1 = await Side.findOne({ name: find.refName });
      let second = find.refName;
      console.log(nextfind1);
      if (nextfind1) {
        const id2 = nextfind1._id;
        let currentwithdrawl = Number(nextfind1.withdrawl);
        withdrawlAmount = currentwithdrawl + (40 / 100) * Number(paid);
        await Side.findByIdAndUpdate(id2, {
          $set: { withdrawl: withdrawlAmount },
        });
        upliner++;

        if (nextfind1.refName) {
          const nextfind2 = await Side.findOne({ name: nextfind1.refName });
          let first = nextfind1.refName;
          console.log(nextfind2);
          if (nextfind2) {
            const id3 = nextfind2._id;
            let currentwithdrawl = Number(nextfind2.withdrawl);
            withdrawlAmount = currentwithdrawl + (10 / 100) * Number(paid);
            await Side.findByIdAndUpdate(id3, {
              $set: { withdrawl: withdrawlAmount },
            });
            upliner++;
          } else {
            let adminData = await Admin.findOne();
            let adminAmount = adminData ? adminData.amount : 0;
            const balance = (10 / 100) * Number(paid);
            let remainingAmount = adminAmount + balance;

            if (adminData) {
              await Admin.findByIdAndUpdate(adminData._id, {
                $set: { amount: remainingAmount },
              });
            } else {
              const newAdmin = new Admin({ amount: remainingAmount });
              await newAdmin.save();
            }
          }
        }
      } else {
        let adminData = await Admin.findOne();
        let adminAmount = adminData ? adminData.amount : 0;
        const balance = (50 / 100) * Number(paid);
        let remainingAmount = adminAmount + balance;

        if (adminData) {
          await Admin.findByIdAndUpdate(adminData._id, {
            $set: { amount: remainingAmount },
          });
        } else {
          const newAdmin = new Admin({ amount: remainingAmount });
          await newAdmin.save();
        }
      }
    } else {
      let adminData = await Admin.findOne();
      let adminAmount = adminData ? adminData.amount : 0;
      const balance = (50 / 100) * Number(paid);
      let remainingAmount = adminAmount + balance;

      if (adminData) {
        await Admin.findByIdAndUpdate(adminData._id, {
          $set: { amount: remainingAmount },
        });
      } else {
        const newAdmin = new Admin({ amount: remainingAmount });
        await newAdmin.save();
      }
    }

    console.log(
      "After Update - Referral Tree:",
      JSON.stringify(referralTree, null, 2)
    );
    const newuser = new Side({
      name,
      number,
      email,
      refName,
      paid,
      withdrawl,
      referrals: {},
    });
    await newuser.save();

    res.status(200).json({
      status: true,
      message: `Registered successfully! Your upliner: ${upliner}`,
      upliners: referralTree,
      data: newuser,
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({
      status: false,
      message: "Register Admin Failed!",
      data: error,
    });
  }
});

//dashboard//
router.get("/dashboard", async (req, res) => {
  try {
    const find = await Side.find();
    // const find = await Side.aggregate([
    //   {
    //     '$match': {
    //       '$and': [
    //         {
    //           'package': 1
    //         }
    //       ]
    //     }
    //   }, {
    //     '$unwind': '$items'
    //   }, {
    //     '$group': {
    //       '_id': {
    //         'name': '$name',
    //         'refName': '$refName'
    //       },
    //       'totalPackage': {
    //         '$sum': '$package'
    //       },
    //       'avgPrice': {
    //         '$avg': '$withdrawl'
    //       }
    //     }
    //   }, {
    //     '$project': {
    //       '_id': 0,
    //       'user': '$_id.name',
    //       'Referrals': '$_id.refName',
    //       'totalPackage': 1,
    //       'avgWithdrawls': {
    //         '$round': [
    //           '$avgPrice', 2
    //         ]
    //       }
    //     }
    //   }, {
    //     '$sort': {
    //       'avgWithdrawls': -1
    //     }
    //   }, {
    //     '$lookup': {
    //       'from': 'cores',
    //       'localField': 'withdrawls',
    //       'foreignField': 'avgcoreamount',
    //       'as': 'avgcoreamount_Core'
    //     }
    //   }
    // ]);
    res
      .status(200)
      .send({ status: true, message: "show Successfully", data: find });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ status: false, message: "Server error" });
  }
});
function buildTree(users) {
  let tree = {};
  let userMap = {};

  for (let user of users) {
    userMap[user.name] = { name: user.name, referrals: [] };
  }

  for (let user of users) {
    if (user.refName && userMap[user.refName]) {
      userMap[user.refName].referrals.push(userMap[user.name]);
    } else {
      tree[user.name] = userMap[user.name];
    }
  }

  return tree;
}

function buildArray(referralTree) {
  return Object.values(referralTree).map((node) => ({
    id: node.name,
    name: node.name,
    children:
      Array.isArray(node.referrals) && node.referrals.length > 0
        ? buildArray(node.referrals)
        : [],
  }));
}

router.get("/tree", async (req, res) => {
  try {
    const users = await Side.find();
    const referralTree = buildTree(users);
    const treeArray = buildArray(referralTree);
    console.log("Tree Data Sent:", JSON.stringify(treeArray, null, 2));
    res
      .status(200)
      .json({ status: true, message: "Tree data retrieved", data: treeArray });
  } catch (error) {
    console.error("Error fetching tree data:", error);
    res
      .status(500)
      .json({ status: false, message: "Failed to retrieve tree data", error });
  }
});
module.exports = router;
