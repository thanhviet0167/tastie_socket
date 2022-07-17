const eventOrder = (io) => {
  io.on("connection", (socket) => {
    console.log(`${socket.id} connected to socket`);
    socket.emit("hello-from-server", { message: "Hello user" });
    socket.on("hello-from-client", (message) => {
      console.log("Message from client", message);
      socket.broadcast.emit("hello-from-server", {
        message: `Message from client: ${message}`,
      });
    });

    // customer send their location
    socket.on("send-location", (location) => {
      console.log("location is", location);
      socket.broadcast.emit("received-location", location);
    });

    // socket.emit("customer-location", {
    //   latitude: 12.204763467174434,
    //   longitude: 109.19002777426466,
    //   latitudeDelta: 0.015,
    //   longitudeDelta: 0.0121,
    // });
    // 12.209547508592735, 109.19092655541277

    // shipper send their location
    socket.on("shipper-location", (data) => {
      console.log("Shipper sent location:", data);
      socket.broadcast.emit("shipperLocation", data);
    });

    // shipper has arrived to the customer's place
    socket.on("Shipper-arrived", (room, userNotificationForm) => {
      console.log("Shipper has arrived");
      socket.broadcast
        .to(room)
        .emit("shipper-has-arrived", userNotificationForm);
      console.log("shipper leave the room", room);
      socket.leave(room);
    });

    socket.on("join-room", (room) => {
      if (socket.rooms[room]) {
        // already in the room
        console.log("joined room already");
      } else {
        socket.join(room);
        console.log("joined room", room);
      }
    });
    socket.on("leave-room", (room) => {
      socket.leave(room);
      console.log(socket.id + " has left the room", room);
    });

    // provider joins their own room (room name: provider-<provider_id> eg: provider-1)
    socket.on("provider-join-room", (room) => {
      socket.join(room);
      console.log("provider join room");
    });

    socket.on(
      "customer-submit-order",
      (orderData, customerData, providerData, order_code, pricing) => {
        console.log(
          "customer submit order",
          orderData,
          customerData,
          providerData,
          order_code,
          pricing
        );
        if (pricing.deliveryMode === 1) {
          // delivery or pickup
          socket.broadcast.emit(
            "shipper-received-order",
            orderData,
            customerData,
            providerData,
            order_code,
            pricing
          );
        } else {
          socket.broadcast.to(`provider-${providerData.provider_id}`).emit(
            "provider-received-order",
            orderData,
            customerData,
            order_code,
            pricing.providerNotificationForm ?? {} // providerNotificationForm
          );
        }

        // server announce to provider
        // socket.broadcast
        //   .to(`provider-${providerData.provider_id}`)
        //   .emit("provider-received-order", orderData, customerData, order_code);
      }
    );

    socket.on(
      "shipper-accepted-order",
      (
        orderData,
        customerData,
        providerData,
        order_code,
        userNotificationForm,
        providerNotificationForm
      ) => {
        // join the same room with the customer when the shipper accept the order (room's name is the order_code)
        const room = order_code;
        socket.join(room);
        socket.broadcast.to(room).emit("order-accepted", userNotificationForm);

        // when the shipper accepted the order, tell provider to prepare the order
        socket.broadcast
          .to(`provider-${providerData.provider_id}`)
          .emit(
            "provider-received-order",
            orderData,
            customerData,
            order_code,
            providerNotificationForm
          );
      }
    );

    socket.on("Arrived-provider", (room, userNotificationForm) => {
      socket.broadcast
        .to(room)
        .emit(userNotificationForm.subject, userNotificationForm.content);
    });

    socket.on("On-the-way", (room, userNotificationForm) => {
      console.log("Shipper is on the way", room);
      socket.broadcast
        .to(room)
        .emit("shipper-on-the-way", userNotificationForm);
    });

    socket.on("Almost-arrived", (room, userNotificationForm) => {
      socket.broadcast
        .to(room)
        .emit("shipper-almost-arrived", userNotificationForm);
    });

    socket.on("shipper-cancel-order", (room, userNotificationForm) => {
      // the room's name is the order_code where the customer is in
      socket.broadcast.to(room).emit("order-canceled", userNotificationForm);
    });

    socket.on("provider-confirmed", (room) => {
      socket.broadcast.to(room).emit("order-confirmed-from-provider");
    });
    socket.on("provider-assigned", (room) => {
      socket.broadcast.to(room).emit("order-assigned");
    });
    socket.on("provider-decline-order", (room) => {
      // the room's name is the order_code where the customer is in
      socket.broadcast
        .to(room)
        .emit("order-canceled", "Your order has been canceled");
    });

    socket.on("customer-inbox", (message, room) => {
      console.log("customer: " + message + " to room " + room);
      socket.broadcast.to(room).emit("receive-customer-inbox", message, room);
    });
    socket.on("shipper-inbox", (message, room) => {
      console.log("shipper: " + message + " to room " + room);
      socket.broadcast.to(room).emit("receive-shipper-inbox", message, room);
    });

    // socket.on('shipper-done-shipping', () => {
    //   socket.broadcast.emit('order-done', )
    // })

    // socket.on("shipperLocation", (data) => {
    //   console.log("shipperLocation", data);
    //   socket.emit("received-shipper-location", { longitude: data.longitude });
    // });

    socket.on("admin-add-ecoupon", () => {
      console.log("admin added ecoupon");
      socket.broadcast.emit("customer-receive-notification", 1);
    });
  });
};

module.exports = eventOrder;
